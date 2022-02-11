import json
import boto3

SENDER = 'Autogram <YOUR EMAIL HERE [KEEP THE ANGLE BRACKETS]>'
AWS_REGION = 'us-west-1' # NOTE Change your region here if not the same
CHARSET = 'UTF-8'
ses = boto3.client('ses')


def lambda_handler(event, _context):
    try:
        for record in event['Records']:
            message_body = json.loads(record['body'])
            if 'to' in message_body and 'message' in message_body and 'subject' in message_body:
                ses.send_email(
                    Destination={
                        'ToAddresses': [message_body['to']]
                    },
                    Message={
                        'Body': {
                            'Text': {
                                'Charset': CHARSET,
                                'Data': message_body['message']
                            }
                        },
                        'Subject': {
                            'Charset': CHARSET,
                            'Data': message_body['subject']
                        }
                    },
                    Source=SENDER
                )
                return {'statusCode': 204}
            else:
                return {
                    'statusCode': 400,
                    'error': 'MISSING_BODY_VALUES',
                    'message': 'missing `subject`, `to` or `message` properties in the request body'
                }
    except Exception as e:
        return {
            'statusCode': 500,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }
