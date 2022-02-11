import os
import boto3
from base64 import b64decode
from json import loads
from bcrypt import checkpw
from jwt import encode

JWT_SECRET = os.environ["SECRET"]
# JWT_SECRET = "rtINZYEEUWkHJ8gmCDyQyfqDZVAROUttk99e9MIpHDc97KbUeduDngegXMhj5BAG6dKlSmr9k5uGaiQh"
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, _context):
    """
    Takes in the email and password from the body and if its valid will return an access token.
    """
    try:
        body_obj = event["body"]
        if ("isBase64Encoded" in event and event["isBase64Encoded"]):
            body_obj = loads(b64decode(body_obj))
        table = dynamodb.Table("users")
        response = table.scan()
        result = response['Items']
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                ExclusiveStartKey=response['LastEvaluatedKey'])
            result.extend(response['Items'])
        for item in result:
            if "email" in body_obj and (body_obj["email"] == item["email"]):
                if("password" in body_obj and checkpw(body_obj["password"].encode("utf-8"), item["password"].encode("utf-8"))):
                    return {
                        "statusCode": 200,
                        "accessToken": encode({"id": item["id"]}, JWT_SECRET, algorithm="HS256"),
                    }
        return {
            "statusCode": 404,
            "error": "USER_NOT_FOUND",
            "message": "Failed to login"
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "error": "UNKNOWN_ERROR",
            "message": "An unknown error occoured",
            "error_details": str(e)
        }
