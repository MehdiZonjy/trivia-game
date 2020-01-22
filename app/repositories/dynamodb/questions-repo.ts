import { QuestionsRepo } from '../types'
import { Question } from '../../model/question'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as _ from 'lodash'

const TABLE = 'questions'

export const createRepo = (client: DocumentClient): QuestionsRepo => {
  const saveQuestion = async (question: Question): Promise<boolean> => {
    await client.put({
      TableName: TABLE,
      Item: question
    }).promise()
    return true
  }

  const getQuestionsCount = async (): Promise<number> => {
    const res = await client.scan({
      TableName: TABLE,
      Select: 'COUNT'
    }).promise()

    return res.Count || 0
  }


  const getQuestion = async (id: string): Promise<Question | undefined> => {
    const res = await client.get({
      TableName: TABLE,
      Key: {
        id
      }
    }).promise()

    return res.Item as Question
  }
  const getRandomQuestions = async (count: number): Promise<string[]> => {
    const res = await client.scan({
      TableName: TABLE,
      ProjectionExpression: 'id'
    }).promise()

    return _.sampleSize(res.Items || [], count).map(q => q.id)
  }




  return { getQuestion, getQuestionsCount, getRandomQuestions, saveQuestion }
}

