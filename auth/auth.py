import os
import boto3
from jwt import decode

JWT_SECRET = os.environ["SECRET"]
# JWT_SECRET = "rtINZYEEUWkHJ8gmCDyQyfqDZVAROUttk99e9MIpHDc97KbUeduDngegXMhj5BAG6dKlSmr9k5uGaiQh"
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, _context):
    """
    Authorizes the user and returns applicable user authorization status.
    """
    try:
        auth_token = ""
        if 'Authorization' in event['headers']:
            auth_token = event["headers"]["Authorization"]
        elif 'authorization' in event['headers']:
            auth_token = event["headers"]["authorization"]
        payload = decode(auth_token, JWT_SECRET, algorithms=["HS256"])
        table = dynamodb.Table("users")
        user = table.get_item(Key={"id": payload["id"]})
        if not("Item" in user):
            return {
                "context": {
                    "statusCode": 404,
                    "error": "USER_NOT_FOUND",
                    "message": "User does not exist"
                },
                "policyDocument":
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "execute-api:Invoke",
                            "Effect": "Deny",
                            "Resource": "*"
                        }
                    ]
                }
            }
    except Exception as e:
        return {
            "context": {
                "statusCode": 500,
                "error": "SERVER_ERROR",
                "message": str(e)
            },
            "policyDocument":
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Deny",
                        "Resource": "*"
                    }
                ]
            }
        }
    return {
        "policyDocument":
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": "*"
                }
            ]
        }
    }
