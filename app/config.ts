import { dynamodbClient } from "../test/repositories/dynamodb/utils";

interface Config {
  jwtSecret: string
  dynamodbEndpoint?: string
}

export const getConfig = (): Config => ({
  jwtSecret: process.env['JWT_SECRET'] || 'hello-worldz',
  dynamodbEndpoint: process.env['AWS_DYNAMO_URL']
})