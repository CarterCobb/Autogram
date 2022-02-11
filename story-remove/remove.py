from datetime import datetime
from dateutil import parser
import json
import boto3

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
cloudwatch_events = boto3.client('events')

# EDIT THIS VARIABLE:
BUCKET = 'YOUR S3 BUCKET NAME HERE'
# 


def lambda_handler(event, _context):
    try:
        if 'story_id' in event and 'user_id' in event and 'rule_name' in event and 'target_id' in event:
            story_id = event['story_id']
            user_id = event['user_id']
            rule = event['rule_name']
            target_id = event['target_id']
            table = dynamodb.Table('users')
            user = table.get_item(Key={'id': user_id})
            if not verifiy_time(user, story_id):
                return {
                    'statusCode': 200,
                    'message': 'skip delete, not correct time'
                }
            filtered_list = []
            img_to_del = ''
            if 'Item' in user:
                for str_story in user['Item']['stories']:
                    story = json.loads(str_story)
                    if not story['id'] == story_id:
                        filtered_list.append(str_story)
                    else:
                        img_to_del = story['image'].split(
                            'https://{BUCKET}.s3.us-west-1.amazonaws.com/')[1]
            table.update_item(
                Key={'id': user_id},
                UpdateExpression='set stories = :filted_list',
                ExpressionAttributeValues={
                    ':filted_list': filtered_list,
                },
                ReturnValues='UPDATED_NEW')
            s3.delete_object(Bucket=BUCKET, Key=img_to_del)
            cloudwatch_events.remove_targets(Rule=rule, Ids=[target_id])
            cloudwatch_events.delete_rule(Name=rule, Force=True)
            return {'statusCode': 204}
        else:
            return {
                'statusCode': 400,
                'error': 'Missing required parameters',
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'error': 'UNKNOWN_ERROR',
            'message': 'An unknown error occured',
            'exception': str(e)
        }


def verifiy_time(user, story_id):
    if 'Item' in user:
        for str_story in user['Item']['stories']:
            story = json.loads(str_story)
            if story['id'] == story_id and datetime.now() > datetime.fromtimestamp(story['posted_at'] / 1000.0):
                return False
    else:
        return False
    return True
