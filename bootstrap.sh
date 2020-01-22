#!/bin/bash

endpoint=${AWS_DYNAMO_URL:-http://localhost:8000}

dynamoReady=false
until "$dynamoReady"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [[ "$code" == "000" ]]; then
    echo "dynamoDb is unavailable - sleeping"
    sleep 1
  else
    dynamoReady=true
  fi;
done
tables=$(aws dynamodb list-tables --endpoint-url "$endpoint" | jq)

# create questions table
questionsExist=$(echo $tables | jq '.TableNames | index( "questions")')
if [[ $questionsExist = null ]]
then
  echo "Creating questions table"
  aws dynamodb create-table --table-name questions --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url "$endpoint"
else
  echo "questions table already exists"
fi


# create sessions table
questionsExist=$(echo $tables | jq '.TableNames | index( "sessions")')
if [[ $questionsExist = null ]]
then
  echo "Creating sessions table"
  aws dynamodb create-table --table-name sessions --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url "$endpoint"
else
  echo "sessions table already exists"
fi

# create questions table
questionsExist=$(echo $tables | jq '.TableNames | index( "responses")')
if [[ $questionsExist = null ]]
then
  echo "Creating responses table"
  aws dynamodb create-table --table-name responses --attribute-definitions AttributeName=sessionRound,AttributeType=S AttributeName=playerId,AttributeType=S --key-schema AttributeName=sessionRound,KeyType=HASH AttributeName=playerId,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url "$endpoint"
else
  echo "responses table already exists"
fi

