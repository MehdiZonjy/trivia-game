import * as AWS from 'aws-sdk'

export const dynamodbDocumentClient = (): AWS.DynamoDB.DocumentClient =>
  new AWS.DynamoDB.DocumentClient({
    endpoint: process.env['AWS_DYNAMO_URL'],
    region: 'us-west-2'
  })


export const dynamodbClient = (): AWS.DynamoDB =>
  new AWS.DynamoDB({
    endpoint: process.env['AWS_DYNAMO_URL'],
    region: 'us-west-2'
  })

export const deleteTable = async (client: AWS.DynamoDB, table: string) => {
  return client.deleteTable({
    TableName: table
  }).promise().catch( e => {})
}

export const createQuestionsTable = async (client: AWS.DynamoDB) => {
  return client.createTable({
    TableName: 'questions',
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }).promise()
}


export const createSessionsTable = async (client: AWS.DynamoDB) => {
  return client.createTable({
    TableName: 'sessions',
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }).promise()
}


export const createSessionResponses = async (client: AWS.DynamoDB) => {
  return client.createTable({
    TableName: 'responses',
    AttributeDefinitions: [
      {
        AttributeName: 'sessionRound',
        AttributeType: 'S'
      },
      {
        AttributeName: 'playerId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'sessionRound',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'playerId',
        KeyType: 'RANGE'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }).promise()
}