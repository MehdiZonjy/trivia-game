import { Response } from '../../model/response'
import { ResponsesRepo } from '../types'
import * as _ from 'lodash'
interface ResponsesStorage {
  [id: string]: Response
}

export const createRepo = (): ResponsesRepo => {
  const storage: ResponsesStorage = {}

  const saveResponse = async (response: Response) => {
    storage[`${response.sessionId}-${response.round}-${response.playerId}`] = response
    return true
  }

  const getSessionRoundResponses = async (sessionId: string, round: number) => {
    const responses = _.reduce(storage, (acc, res, key) => {
      if (key.startsWith(`${sessionId}-${round}`)) {
        acc.push(res)
      }
      return acc
    }, [] as Response[])
    
    return responses
  }

  return {saveResponse, getSessionRoundResponses}
}