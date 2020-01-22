import { ResponsesRepo } from '../types'
import { Response } from '../../model/response'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as _ from 'lodash'

const TABLE = 'responses'


interface ResponseEntity {
  playerId: string
  sessionId: string
  round: number
  answerId: string
  questionId: string
  sessionRound: string
}

const primaryKey = (sessionId: string, round: number) => `${sessionId}-${round}`

export const createRepo = (client: DocumentClient): ResponsesRepo => {
  const saveResponse = async (response: Response): Promise<boolean> => {

    const entity: ResponseEntity = {
      ...response,
      sessionRound: primaryKey(response.sessionId, response.round)
    }
    await client.put({
      TableName: TABLE,
      Item: entity
    }).promise()

    return true
  }

  const getSessionRoundResponses = async (sessionId: string, round: number): Promise<Response[]> => {
    const result = await client.query({
      TableName: TABLE,
      KeyConditionExpression: 'sessionRound = :sessionRound',
      ExpressionAttributeValues: {
        ':sessionRound': primaryKey(sessionId, round)
      }
    }).promise()
    return ((result.Items as any[]) || []).map((entity: ResponseEntity) => ({
      playerId: entity.playerId,
      sessionId: entity.sessionId,
      round: entity.round,
      answerId: entity.answerId,
      questionId: entity.questionId
    }))
  }

  return {getSessionRoundResponses,saveResponse}


}