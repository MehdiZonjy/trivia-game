import { ResponsesRepo, SessionsRepo, QuestionsRepo } from '../repositories/types'
import * as sessionModel from '../model/session'
import { PlayerState } from '../model/session'
import * as responsesModel from '../model/response'
import { ResourceNotFound } from './errors'
import * as _ from 'lodash'
interface ResponsesService {
  submitResponse: (sessionId: string, playerId: string, round: number, answerId: string, questionId: string) => Promise<boolean>
  roundStats: (sessionId: string, round: number) => Promise<RoundStats>
}

interface RoundStats {
  text: string
  responses: PlayersResponseDTO[]
}

interface PlayersResponseDTO {
  text: string
  playersCount: number
}

interface CreateResponsesService {
  responsesRepo: ResponsesRepo
  sessionsRepo: SessionsRepo
  questionsRepo: QuestionsRepo
}

export const createResponsesSession = ({ responsesRepo, sessionsRepo, questionsRepo }: CreateResponsesService): ResponsesService => {

  const submitResponse = async (sessionId: string, playerId: string, round: number, answerId: string, questionId: string): Promise<boolean> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new Error("Session not found")
    }

    if (!sessionModel.isSessionInProgress(session)) {
      throw new Error("Session is no longer in progress")
    }
    const playerState = sessionModel.getPlayerState(session, playerId)
    switch (playerState) {
      case PlayerState.Disqualified:
        throw new Error("You have been disqualified")
      case PlayerState.NotPartOfSession:
        throw new Error("You aren't part of this session")
      case PlayerState.Qualified:
        await responsesRepo.saveResponse(responsesModel.createResponse({
          answerId,
          playerId,
          round,
          sessionId,
          questionId
        }))
    }
    return true

  }

  const roundStats = async (sessionId: string, round: number): Promise<RoundStats> => {
    const responses = await responsesRepo.getSessionRoundResponses(sessionId, round)
    const session = await sessionsRepo.getSession(sessionId)

    if (!session) {
      throw new ResourceNotFound('session not found', sessionId)
    }

    const questionId = sessionModel.roundQuestion(session, round)
    const question = await questionsRepo.getQuestion(questionId)

    if (!question) {
      throw new ResourceNotFound('Question not found', questionId)
    }

    let answersStats = question.answers.reduce((acc, ans) => {
      acc[ans.id] = {
        playersCount: 0,
        text: ans.text
      }
      return acc
    }, {} as { [k: string]: PlayersResponseDTO })

    answersStats = responses.reduce((acc, response) => {
      const answer = acc[response.answerId]
      answer.playersCount++
      return acc
    }, answersStats)

    return {
      responses: _.values(answersStats),
      text: question.text
    }
  }

  return { submitResponse , roundStats}

} 