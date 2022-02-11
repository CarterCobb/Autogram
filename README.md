# Autogram

An Instagram clone built by Carter J. Cobb

## Details

This project uses

- AWS Lambda
- AWS DynamoDB
- AWS API Gateway
- AWS EventBridge
- AWS SQS
- AWS SES
- AWS ECR
- AWS S3
- React.js

to create a simplified Instagram clone.

## Project description

Autogram is a simplistic Instagram clone. It features, a login, registration form, posts, 24 hour stories, verified accounts, suggested accounts, an explore page, account following logic, and email notifications. There are features still being added that are templated in the current architecture. These include but are not limited to, post likes and post comments.

Please not that the code in this repository is to build serverless functions (FAAS) through AWS and cannot run standalone.

## Requirements to deploy and run

- AWS account [sign up here](https://portal.aws.amazon.com/billing/signup#/start)
- AWS CLI installed [download link](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Node.js installed [download link](https://nodejs.org/en/download/)
- Docker insalled [download link](https://www.docker.com/products/docker-desktop)
- WSL2 installed (WindowsOS Only) [download link](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)

## Recommended but not required items

- Postman installed [download link](https://www.postman.com/downloads/)
- Visual Studio Code (The Code editor used to develop this project) [download link](https://code.visualstudio.com/download)

## Prepare to run

Becasue this project is built with AWS as a dependancy you will need to follow these instructions closely to run the project.

### Create ECR repositories in AWS

In order to deploy the lambdas, you will need to create the following blank ECR repositories in AWS [here](https://us-west-1.console.aws.amazon.com/ecr/repositories):

- autogram/account
- autogram/auth
- autogram/email
- autogram/login
- autogram/remove

### Create an AWS API Gateway

This is an imprtant step to complete before editing other files.

- Navigate to [AWS API Gateway](https://us-west-1.console.aws.amazon.com/apigateway/main/apis) and click `Create API`.
- Select `REST API` and click `Build`
- Keep all the settings default and give the API a name like `Autogram` and click `Create`
- Keep this tab open for later!!

### Create an AWS S3 Bucket

AWS S3 is the container to store profile pictures, posts, and stories.

- Navigate to [AWS S3](https://s3.console.aws.amazon.com/s3/home) and click `Create Bucket`
- Give your bucket a name AND keep note of it.
- Enable ACLs with default settings
- UNCHECK `Block all public access` and confirm your understanding
- Keep all other settings default

### Create DynamoDB Tables

This project requires three tables to be made. Two of whitch must be pre-populated.

- Navigate to [AWS DynamoDB](https://us-west-1.console.aws.amazon.com/dynamodbv2/home) and click `Create table`
- Create three tables named `permission`, `security_group`, and `users` <- Names are important do NOT neglect these names
- Enter the `permissions` table and add the following items:

```jsonc
/*
* This table contains permissions for users.
* The intent here was to mock AWS's style for user authentication for a more secure system.
*/

// Item 1
{
    "id": "d1e6e9acb16f03b526d392e52fdb49e6f77d573c",
    "descriptor": "CAN_POST_STORY",
    "metadata": "{\"can_post_story\": true}"
}
// Item 2
{
    "id": "0abdacaab05aca1be4deb2e73581bf14f32bf492",
    "descriptor": "CAN_DELETE_STORY",
    "metadata": "{\"can_delete_story\": true}"
}
// Item 3
{
    "id": "370e8fe25ce0646c410588348232a036ad1d2c41",
    "descriptor": "IS_ADMIN",
    "metadata": "{\"is_admin\": true}"
}
// Item 4
{
    "id": "89e6723e5d370c0e98e9dfbead03442666894859",
    "descriptor": "CAN_DELETE_POST",
    "metadata": "{\"can_delete_post\": true}"
}
// Item 5
{
    "id": "dac04d4bf710d4bf1fbcb45ee0dd1284604794f6",
    "descriptor": "CAN_POST",
    "metadata": "{\"can_post\": true}"
}
// Item 6
{
    "id": "9ef964e457e4149c03043ddeafc3f519fb51fc5e",
    "descriptor": "IS_VERIFIED",
    "metadata": "{\"is_verified\": true}"
}
```

- Next is to create three user security groups; in the `security_group` table add these items:

```jsonc
/*
* This groups are basically lists of permissions.
* Each group gives access to all the permissions from the last table listed in a group.
*/

// Item 1
{
    "id": "e254c3485122ff610e6c686803f757f3c21ca434",
    "descriptor": "USER",
    "permissions": [
        "d1e6e9acb16f03b526d392e52fdb49e6f77d573c",
        "0abdacaab05aca1be4deb2e73581bf14f32bf492",
        "89e6723e5d370c0e98e9dfbead03442666894859",
        "dac04d4bf710d4bf1fbcb45ee0dd1284604794f6"
    ]
}
// Item 2
{
    "id": "820a43084308df6675891b69418228170c8ba827",
    "descriptor": "ADMIN",
    "permissions": [
        "370e8fe25ce0646c410588348232a036ad1d2c41"
    ]
}
//Item 3
{
    "id": "254ca7b7dd947f80b54ea6f1da2c396330961d86",
    "descriptor": "VERIFIED_USER",
    "permissions": [
        "d1e6e9acb16f03b526d392e52fdb49e6f77d573c",
        "0abdacaab05aca1be4deb2e73581bf14f32bf492",
        "89e6723e5d370c0e98e9dfbead03442666894859",
        "dac04d4bf710d4bf1fbcb45ee0dd1284604794f6",
        "9ef964e457e4149c03043ddeafc3f519fb51fc5e"
    ]
}
```

### Create AWS role for all recources

Its important to give permissions to the services being used so they can talk to each other.

- Navigate to [AWS roles](https://console.aws.amazon.com/iamv2/home?#/roles) and click `Create role`
- Attach the following policies:
  - AmazonSQSFullAccess
  - AmazonS3FullAccess
  - CloudWatchFullAccess
  - AmazonDynamoDBFullAccess
  - AmazonSESFullAccess
  - CloudWatchLogsFullAccess
  - AWSLambdaSQSQueueExecutionRole
  - CloudWatchEventsFullAccess
- Name the role something easy to remember like `autogram-role`
- Create the role and copy the ARN that AWS generates
- Now create an inline policy and paste the following JSON into the JSON tab
  - NOTE: replace `<AWS_ARN_HERE>` with the ARN you just coppied

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:PassRole"
            ],
            "Resource": "<AWS_ARN_HERE>"
        }
    ]
}
```

- Save the role and coppied ARN

### Edit deploy script with your AWS details

In the file named `deploy_script.bat` replace all the items in `<>` with your account details.

e.g:

- `<REGION>` -> `us-west-1`
- `<ACCOUNT_ID>` -> `123456789012` [more info here](https://docs.aws.amazon.com/IAM/latest/UserGuide/console_account-alias.html)

### Run the deploy script

This is the first time you will need to run this script.

Simply right click on the `deploy_script.bat` and select `Reveal in File Explorer` and double click the file in the File Explorer

### Create Lambdas

Create all the lambdas that are being used for the project. Some will need to be re-deployed later.

- Navigate to [AWS Lambda](https://us-west-1.console.aws.amazon.com/lambda/home) and click `Create function`
- Select `Container image` and name the lambda relative to each ECR repository for the project.
- Browse images and find the image from ECR for each repository.
- IMPORTANT: select the dropdown for `Change default execution role` and choose `Use an existing role`; choose the role you created earlier.
- Create the function - do this for all five ECR repositories.

For the following lambdas add the `SECRET=<random JWT secret>` environment variable under the `Configuration` tab:

- Account
- Auth
- Login

### Create AWS SQS Queue

In order to send email notifications to the users, SQS needs to be configured. Also make sure in AWS SES to verifiy your emails that will be used on the project.

- Navigate to [AWS SQS](https://us-west-1.console.aws.amazon.com/sqs/v2/home) and click `Create queue`
- Select `FIFO` and name the queue; all other settings remain default
- Once the queue is created, enter it and select the `Lambda triggers` tab
- Add the Email lambda you just configured.

AWS SQS will not deliver emails if you dont allow the `email` lamda to be invoked by SQS. To allow it invocation:

- Navigate to the `email` lambda in AWS
- Select the `Configuration` tab and then select `Permissions`
- Scroll down to `Resource-based policy` and click on `Add permissions`
- Choose `AWS service` and select `SQS from the dropdown`
- Set `Statement ID` to `1`
- Keep the `Principle` the same (`sqs.amazonaws.com`)
- Set the `Source ARN` to your AWS SQS `.fifo` URL
- Set the `Action` to `lambda:InvokeFunction`

### Edit Lambda files to use your AWS account direct links

Starting from the top most directory open `./account/account.py`.

- On line 431 paste the ARN to the `remove` lambda
- On line 432 paste the ARN to the AWS role you created earlier
- On line 455 paste the `.fifo` URL to the AWS SQS queue
- On line 491 paste the AWS S3 bucket name to the variable

Next is `./email/email_lambda.py`

- On line 4 replace the email in `<>` with one of your verified AWS SES emails
- On line 5 replace the region with your AWS region

Last is `./story-remove/remove.py`

- On line 11 put your AWS S3 bucket name

### Run the deployment script again

This first deployment script run was to build out the lambdas. This one is to update the lambdas to use your AWS resources.

Right click on the `deploy_script.bat` and select `Reveal in File Explorer` and double click the file in the File Explorer

### Build the API

Return back to your AWS API Gateway tab.

- Under the `Resources` tab on the left select `Actions` and create a resource named `account`
- Create another resource named `login`

Next you need to build an Autorizer. To do this select `Authorizers` on the left

- Click `Create New Authorizer`
- Name the authorizer something recognisable
- The type is `Lambda`
- Choose the `auth` lambda
- Leave `Lambda Invoke Role` blank
- For the `Lambda Event Payload` select `Request`
- Enter `Authorization` in the `Identity Sources` input field
- Disable `Authorization Caching`
- Create

This next part relates to the `/account` resource back in the `Resources` tab on the left

- Select the `Create Method` option under the `Actions` dropdown and create the following methods:
  - DELETE
  - GET
  - PATCH
  - POST
  - PUT

Under each method configure it the same as follows:

- `Integration type` is `Lambda Function`
- Choose the `account` lambda function
- Keep all other settings default and save.
- On the `Method Execution` screen for each method:
  - Select `Integration Request`
  - Expand the `Mapping Templates` section
  - Select `When there are no templates defined`
  - Click `Add mapping template`
  - Enter `application/json` in the text input and click the check mark icon
  - Pase the following into the code editor that pops up and click `Save`:

```vtl
{
  "body" : $input.json('$'),
  "headers": {
    #foreach($header in $input.params().header.keySet())
    "$header": "$util.escapeJavaScript($input.params().header.get($header))" #if($foreach.hasNext),#end

    #end
  },
  "httpMethod": "$context.httpMethod",
  "pathParameters": {
    #foreach($param in $input.params().path.keySet())
    "$param": "$util.escapeJavaScript($input.params().path.get($param))" #if($foreach.hasNext),#end

    #end
  },
  "queryStringParameters": {
    #foreach($queryParam in $input.params().querystring.keySet())
    "$queryParam": "$util.escapeJavaScript($input.params().querystring.get($queryParam))" #if($foreach.hasNext),#end
    #end
  }  
}
```

The following applies to methods `DELETE`, `PATCH`, and `PUT`:

- Back on the `Method Execution` screen for each method click on `Method Request`
- Under `Settings` find `Authorization` and click the pencil icon
- Select the authorizer you made earlier and click the check mark icon

Next is the `/login` resource.

- Create a method `POST`
- As before `Integration type` is `Lambda Function`
- Choose the `login` lambda function
- Keep all other settings default and save.

Next CORS needs to be enables so that the React.js front-end can call the API

- Under BOTH the `/account` and `/login` resource select the `Enable CORS` button in the `Actions` dropdown
- Make sure all the methods avaliable are selected
- Keep all the settings default and click `Enable CORS and replace existing CORS headers`

Finally the API can be staged and deployed.

- Under the `Actions` button select `Deploy API`
- Set the Deployment stage to `[New Stage]`
- Set the Stage name to `v1`
- Click `Deploy`
- Under the `Stages` section on the left, click on `v1`
- Copy the `Invoke URL` from the blue header.

### Edit React.js API file to point to your API

The front-end needs to point to your AWS API Gateway API. To do this you simply need to edit the base URL for the API  as follows:

- Enter the `client` folder in the root directory
- Under the `src/api` directories there is a file named `account.js`
- On line 7 paste that `Invoke URL` to the variable

## Run the App

Good news, the setup is finally done. The last step is to actually run the project.

- Run `cd client` in the root directory (Open a new terminal to do so)
- Run `npm i`
- After the install finishes, run `npm run start`
- Autogram will automatically open on [localhost:3000](http://localhost:3000)

You will be greeted with a login page. Because its the first time running the project you will need to register a new user.

- Click `register` under the login button
- Fill out the form
- Register

Now you can play around with the program. Fell free to edit code and mess around. If you find an issue and or have a new feature dont hesitate to submit a pull request.

## Additional Details

This was built as an assignment for a college class at [Neumont College of Computer Science](https://www.neumont.edu/). Please do not use any part of this project in any way that would be considered plagiarism.
