from datetime import datetime
import time
import json
import os
import random
import boto3
from base64 import b64decode
from jwt import decode
import hashlib
import bcrypt

JWT_SECRET = os.environ['SECRET']
# JWT_SECRET = 'rtINZYEEUWkHJ8gmCDyQyfqDZVAROUttk99e9MIpHDc97KbUeduDngegXMhj5BAG6dKlSmr9k5uGaiQh'
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
cloudwatch_events = boto3.client('events')
sqs = boto3.client('sqs')


def lambda_handler(event, _context):
    try:
        # NOTE 'GET' actions
        if event['httpMethod'] == 'GET':
            if 'query' in event['queryStringParameters']:
                return get_user_by_id(event['queryStringParameters']['query'])
            elif 'explore' in event['queryStringParameters']:
                return get_all_users()
            elif 'username' in event['queryStringParameters']:
                return get_user_by_username(event['queryStringParameters']['username'])
            elif 'suggestion' in event['queryStringParameters']:
                users = get_all_users()
                n = 5
                if len(users) < 5:
                    n = len(users)
                return random.sample(users, n)
            elif 'ids' in event['queryStringParameters']:
                accounts = []
                for id in json.loads(event['queryStringParameters']['ids']):
                    accounts.append(get_user_by_id(id))
                return accounts
            else:
                if 'Authorization' in event['headers']:
                    AUTH_TOKEN = event['headers']['Authorization']
                    return get_user(AUTH_TOKEN)
                else:
                    return {
                        'statusCode': 403,
                        'error': 'Failed to find auth token'
                    }

        # NOTE 'POST' actions
        elif event['httpMethod'] == 'POST':
            table = dynamodb.Table('users')
            # NOTE create new account
            if not valid_username(event['body']['username']):
                return {
                    'statusCode': 400,
                    'error': 'Username taken'
                }
            if not valid_email(event['body']['email']):
                return {
                    'statusCode': 400,
                    'error': 'Email in use'
                }
            user_id = generate_id()
            image = upload_image(
                event['body']['encoded_img'], f'profile.{user_id}')
            new_user = {
                'id': user_id,
                'username': event['body']['username'],
                'email': event['body']['email'],
                'bio': event['body']['bio'],
                'password': bcrypt.hashpw(event['body']['password'].encode('utf-8'), bcrypt.gensalt(4)).decode('utf-8'),
                'posts': [],
                'stories': [],
                'following': [],
                'followers': [],
                'created_at': round(time.time() * 1000),
                'security_group': 'e254c3485122ff610e6c686803f757f3c21ca434',
                'image': image
            }
            table.put_item(Item=new_user)
            send_email(
                to=new_user['email'],
                subject='Welcome to Autogram!',
                message=f"Thanks, {new_user['username']} for creating an Autogram account. You can now interact with everyone her on Autogram."
            )
            return {'statusCode': 201}

        # NOTE 'PUT' actions
        elif event['httpMethod'] == 'PUT':
            AUTH_TOKEN = event['headers']['Authorization']
            user = get_user(AUTH_TOKEN)
            table = dynamodb.Table('users')
            if 'action_type' in event['queryStringParameters']:
                # NOTE create a post
                if event['queryStringParameters']['action_type'] == 'create_post':
                    if user['permissions']['can_post']:
                        post_id = generate_id()
                        image = upload_image(
                            event['body']['encoded_img'],
                            f"post.{user['id']}.{post_id}")
                        post = {
                            'id': post_id,
                            'image': image,
                            'likes': 0,
                            'description': event['body']['description'],
                            'comments': [],
                            'posted_at': round(time.time() * 1000)
                        }
                        table.update_item(
                            Key={'id': user['id']},
                            UpdateExpression="set posts = list_append(if_not_exists(posts, :empty_list), :post)",
                            ExpressionAttributeValues={
                                ":empty_list": [],
                                ":post": [json.dumps(post)],
                            },
                            ReturnValues="UPDATED_NEW"
                        )
                        return {'statusCode': 201}
                    else:
                        return {
                            'statusCode': 403,
                            'error': 'Not allowed to create a post.'
                        }
                # NOTE create a story
                elif event['queryStringParameters']['action_type'] == 'create_story':
                    if user['permissions']['can_post_story']:
                        story_id = generate_id()
                        image = upload_image(
                            event['body']['encoded_img'], f"story.{user['id']}.{story_id}")
                        story = {
                            'id': story_id,
                            'image': image,
                            'posted_at': round(time.time() * 1000)
                        }
                        table.update_item(
                            Key={'id': user['id']},
                            UpdateExpression="set stories = list_append(if_not_exists(stories, :empty_list), :story)",
                            ExpressionAttributeValues={
                                ":empty_list": [],
                                ":story": [json.dumps(story)],
                            },
                            ReturnValues="UPDATED_NEW"
                        )
                        schedule_cloudwatch_delete(story_id, user['id'])
                        return {'statusCode': 201}
                else:
                    return {
                        'statusCode': 404,
                        'error': 'No action found'
                    }
            # NOTE follow another account
            elif 'follow' in event['queryStringParameters']:
                if 'id' in event['queryStringParameters']:
                    followed_user = get_user_by_id(
                        event['queryStringParameters']['id'])
                    table.update_item(
                        Key={'id': event['queryStringParameters']['id']},
                        UpdateExpression="set followers = list_append(if_not_exists(followers, :empty_list), :follower)",
                        ExpressionAttributeValues={
                            ":empty_list": [],
                            ":follower": [user['id']],
                        },
                        ReturnValues="UPDATED_NEW"
                    )
                    table.update_item(
                        Key={'id': user['id']},
                        UpdateExpression="set following = list_append(if_not_exists(following, :empty_list), :account)",
                        ExpressionAttributeValues={
                            ":empty_list": [],
                            ":account": [event['queryStringParameters']['id']],
                        },
                        ReturnValues="UPDATED_NEW"
                    )
                    send_email(
                        followed_user['email'], 'New Follower', f"[{user['username']}] followed you.")
                    return {'statusCode': 204}
            # NOTE unfollow account
            elif 'unfollow' in event['queryStringParameters']:
                if 'id' in event['queryStringParameters']:
                    followed_user = get_user_by_id(
                        event['queryStringParameters']['id'])
                    followers = [
                        follower for follower in followed_user['followers'] if not follower == user['id']
                    ]
                    table.update_item(
                        Key={'id': event['queryStringParameters']['id']},
                        UpdateExpression="set followers = :f",
                        ExpressionAttributeValues={
                            ":f": followers,
                        },
                        ReturnValues="UPDATED_NEW"
                    )
                    following = [
                        account for account in user['following'] if not account == event['queryStringParameters']['id']
                    ]
                    table.update_item(
                        Key={'id': user['id']},
                        UpdateExpression="set following = :f",
                        ExpressionAttributeValues={
                            ":f": following,
                        },
                        ReturnValues="UPDATED_NEW"
                    )
                    return {'statusCode': 204}
            else:
                # NOTE verify user if admin
                if 'id' in event['queryStringParameters']:
                    if user['permissions']['is_admin']:
                        table.update_item(
                            Key={'id': event['queryStringParameters']['id']},
                            UpdateExpression="set security_group = :security_group",
                            ExpressionAttributeValues={
                                ":security_group": '254ca7b7dd947f80b54ea6f1da2c396330961d86',
                            },
                            ReturnValues="UPDATED_NEW"
                        )
                        edited_user = get_user_by_id(
                            event['queryStringParameters']['id'])
                        send_email(
                            to=edited_user['email'],
                            subject='You\'ve been verified!!',
                            message=f"Congrats {edited_user['username']}, you have just been verified by Autogram! Enjoy your blue checkmark.")
                        return {'statusCode': 204}
                    else:
                        return {
                            'statusCode': 403,
                            'error': 'Not allowed to verify user.'
                        }
                else:
                    return {
                        'statusCode': 400,
                        'error': 'Missing requrired query string parameter \'id\''
                    }

        # NOTE 'PATCH' actions
        elif event['httpMethod'] == 'PATCH':
            # NOTE update profile items
            AUTH_TOKEN = event['headers']['Authorization']
            user = get_user(AUTH_TOKEN)
            if 'email' in event['body']:
                if not valid_email(event['body']['email']):
                    return {
                        'statusCode': 400,
                        'error': 'Email in use'
                    }
            if 'username' in event['body']:
                if not valid_username(event['body']['username']):
                    return {
                        'statusCode': 400,
                        'error': 'Username is taken'
                    }
            if 'image' in event['body']:
                upload_image(
                    event['body']['image'], f"profile.{user['id']}")
            if 'security_group' in event['body']:
                return {
                    'statusCode': 400,
                    'error': 'Not allowed to set \'security_group\'. All changes rolled back.'
                }
            else:
                table = dynamodb.Table('users')
                for item in event['body'].keys():
                    update = f'set {item} = :value'
                    value = event['body'][item]
                    if item == 'password':
                        value = bcrypt.hashpw(
                            value.encode('utf-8'), bcrypt.gensalt(4))
                    table.update_item(
                        Key={'id': user['id']},
                        UpdateExpression=update,
                        ExpressionAttributeValues={
                            ':value': value
                        },
                        ReturnValues='UPDATED_NEW'
                    )
                return {'statusCode': 204}

        # NOTE 'DELETE' actions
        elif event['httpMethod'] == 'DELETE':
            AUTH_TOKEN = event['headers']['Authorization']
            user = get_user(AUTH_TOKEN)
            table = dynamodb.Table('users')
            if 'action_type' in event['queryStringParameters']:
                # NOTE delete post
                if event['queryStringParameters']['action_type'] == 'rm_post':
                    id = event['queryStringParameters']['id']
                    posts = []
                    for str_post in user['posts']:
                        post = json.loads(str_post)
                        if not post['id'] == id:
                            posts.append(str_post)
                    table.update_item(
                        Key={'id': user['id']},
                        UpdateExpression='set posts = :p',
                        ExpressionAttributeValues={
                            ':p': posts
                        },
                        ReturnValues='UPDATED_NEW'
                    )
                    return {'statusCode': 204}
                # NOTE delete story
                elif event['queryStringParameters']['action_type'] == 'rm_story':
                    id = event['queryStringParameters']['id']
                    stories = []
                    for str_story in user['stories']:
                        story = json.loads(str_story)
                        if story['id'] == id:
                            story['deleted'] = True
                            stories.append(json.dumps(story))
                        else:
                            stories.append(str_story)
                    table.update_item(
                        Key={'id': user['id']},
                        UpdateExpression='set stories = :p',
                        ExpressionAttributeValues={
                            ':p': stories
                        },
                        ReturnValues='UPDATED_NEW'
                    )
                    return {'statusCode': 204}
                else:
                    return {
                        'statusCode': 404,
                        'error': f"\'action_type\': {event['queryStringParameters']['action_type']} is not valid."
                    }
            # NOTE terminate account
            else:
                send_email(user['email'], 'Account Termination',
                           'We are sorry to see you go. You are always welcome back to the Autogram community.')
                table.delete_item(Key={'id': user['id']})
                return {'statusCode': 204}
        else:
            return {
                'statusCode': 404,
                'error': 'http method not found.'
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'error': 'UNKNOWN_ERROR',
            'message': 'An unknown error occured',
            'exception': str(e)
        }


def get_user(token):
    """
    Get the full representation of an authenticated user.
    Also sets the users permissions from their security group.
    """
    payload = decode(token, JWT_SECRET, algorithms=['HS256'])
    return get_user_by_id(payload['id'])


def get_user_by_id(id):
    table = dynamodb.Table('users')
    user = table.get_item(Key={'id': id})
    if not 'Item' in user:
        return None
    security_group = get_security_group(user['Item'])
    user['Item']['security_group'] = security_group
    user['Item']['permissions'] = get_permissions(
        security_group['permissions'])
    user['Item']['password'] = None
    return user['Item']


def get_user_by_username(username):
    users = get_all_users()
    for user in users:
        if user['username'] == username:
            return user
    return None


def get_all_users(include_admin=False):
    table = dynamodb.Table('users')
    response = table.scan()
    result = response['Items']
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        result.extend(response['Items'])
    for user in result:
        security_group = get_security_group(user)
        user['security_group'] = security_group
        user['permissions'] = get_permissions(
            security_group['permissions'])
        user['password'] = None
    if include_admin:
        return result
    return [usr for usr in result if not usr['permissions']['is_admin']]


def get_security_group(user):
    """
    Find the security group for the user.
    """
    table = dynamodb.Table('security_group')
    group = table.get_item(Key={'id': user['security_group']})
    if not 'Item' in group:
        return None
    return group['Item']


def get_permissions(ids):
    """
    Get the permission metadata for each given id
    """
    permissions = {
        'can_post': False,
        'can_delete_post': False,
        'can_post_story': False,
        'can_delete_story': False,
        'is_verified': False,
        'is_admin': False
    }
    table = dynamodb.Table('permission')
    for permission_id in ids:
        permission = table.get_item(Key={'id': permission_id})
        if 'Item' in permission:
            permissions[permission['Item']['descriptor'].lower()] = json.loads(
                permission['Item']['metadata'])[permission['Item']['descriptor'].lower()]
    return permissions


def schedule_cloudwatch_delete(id, user_id):
    rule_name = f'REMOVE_{id}'
    # EDIT THESE VARIABLES
    lambda_arn = 'PASTE LAMBDA ARN HERE'
    role_arn = 'PASTE ROLE ARN HERE'
    # 
    cloudwatch_events.put_rule(
        Name=rule_name,
        RoleArn=role_arn,
        ScheduleExpression='rate(24 hours)',
        State='ENABLED'
    )
    input = {
        'story_id': id,
        'user_id': user_id,
        'rule_name': rule_name,
        'target_id': generate_id(),
    }
    cloudwatch_events.put_targets(Rule=rule_name, Targets=[{
        'Arn': lambda_arn,
        'Id': input['target_id'],
        'Input': json.dumps(input)
    }])


def send_email(to, subject, message):
    # EDIT THIS VARIABLE
    queue_url = 'PASTE SQS .FIFO URL HERE'
    # 
    send = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps({
            'to': to,
            'subject': subject,
            'message': message
        }),
        MessageGroupId=generate_id(),
        MessageDeduplicationId=generate_id()
    )
    print(send)


def valid_username(username):
    users = get_all_users(True)
    for user in users:
        if user['username'] == username:
            return False
    return True


def valid_email(email):
    users = get_all_users(True)
    for user in users:
        if user['email'] == email:
            return False
    return True


def upload_image(image_string, key):
    """
    @param key -> <object_type>.<user_id>.<item_id>
    """
    # EDIT THIS VARIABLE
    bucket = 'YOUR S3 BUCKET NAME HERE'
    # 
    parts = image_string.split(',')
    content_type = parts[0].split(':')[1].split(';')[0]
    name = f"{key}.{content_type.split('/')[1]}"
    s3.put_object(
        ACL='public-read',
        Bucket=bucket,
        ContentType=content_type,
        Key=name,
        Body=b64decode(parts[1])
    )
    return f"https://{bucket}.s3.us-west-1.amazonaws.com/{name}"


def generate_id():
    return hashlib.sha1(f'{datetime.utcnow().timestamp()}'.encode('utf-8')).hexdigest()
