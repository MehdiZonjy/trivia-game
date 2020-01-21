import { ResponsesRepo, SessionsRepo } from '../repositories/types'
import * as sessionModel from '../model/session'
import { PlayerState } from '../model/session'
import * as responsesModel from '../model/response'
interface ResponsesService {
  submitResponse: (sessionId: string, playerId: string, round: number, answerId: string, questionId: string) => Promise<boolean>

}


interface CreateResponsesService {
  responsesRepo: ResponsesRepo
  sessionsRepo: SessionsRepo
}

export const createResponsesSession = ({ responsesRepo, sessionsRepo }: CreateResponsesService): ResponsesService => {

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

  return { submitResponse }

} 