import { SessionsRepo } from '../types'
import { Session, SessionState } from '../../model/session'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as _ from 'lodash'


const TABLE = 'sessions'

export const createRepo = (client: DocumentClient): SessionsRepo => {
  const saveSession = async (session: Session): Promise<boolean> => {
    
    await client.put({
      TableName: TABLE,
      Item: session
    }).promise()
    return true
  }
  const getSession = async (id: string): Promise<Session | undefined> => {
    const res = await client.get({
      TableName: TABLE,
      Key: {
        id
      }
    }).promise()

    return res.Item as Session
  }

  const getActiveSessions = async (): Promise<Session[]> => {
   const res = await client.scan({
     TableName: TABLE,
    FilterExpression : '#state = :inProgress OR #state = :new',
    ExpressionAttributeValues : {':inProgress' : SessionState.inProgress, ':new': SessionState.newSession},
    ExpressionAttributeNames: {
      "#state": "state"
    }
   }).promise()

   return (res.Items as any) || []
  }

  return {getActiveSessions,getSession,saveSession}


}