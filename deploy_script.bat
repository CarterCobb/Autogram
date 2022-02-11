@echo off

echo ***BUILD, TAG, and PUSH LAMBDA IMAGES TO ECR***
echo . 
echo ---------BUILD PHASE---------

echo .
echo Building auth image . . .
cd auth
docker build -t autogram/auth:latest -f Dockerfile .
cd ..
echo .

echo Building login image . . .
cd login
docker build -t autogram/login:latest -f Dockerfile .
cd ..
echo .

echo Building account image . . .
cd account
docker build -t autogram/account:latest -f Dockerfile .
cd ..
echo .

echo .
echo Building email image . . .
cd email
docker build -t autogram/email:latest -f Dockerfile .
cd ..
echo .

echo .
echo Building remove image . . .
cd story-remove
docker build -t autogram/remove:latest -f Dockerfile .
cd ..
echo .

echo ---------LOGIN PHASE---------
echo . 
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
echo .

echo ---------TAG PHASE---------

echo .
echo Applying tag to auth . . .
docker tag autogram/auth:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/auth:latest
echo .

echo Applying tag to login . . .
docker tag autogram/login:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/login:latest
echo .

echo Applying tag to account . . .
docker tag autogram/account:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/account:latest
echo .

echo Applying tag to email . . .
docker tag autogram/email:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/email:latest
echo .

echo Applying tag to remove . . .
docker tag autogram/remove:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/remove:latest
echo .

echo ---------PUSH PHASE---------

echo .
echo Pushing auth to ECR . . .
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/auth:latest
echo .

echo Pushing login to ECR . . .
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/login:latest
echo .

echo Pushing account to ECR . . .
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/account:latest
echo .

echo Pushing email to ECR . . .
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/email:latest
echo .

echo Pushing remove to ECR . . .
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/autogram/remove:latest
echo .


echo ---------COMPLETED---------
pause