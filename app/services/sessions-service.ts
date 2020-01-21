import { Session } from "../model/session";
import { SessionsRepo, QuestionsRepo, ResponsesRepo } from "../repositories/types";
import * as SessionModel from '../model/session'
import { AuthService } from "./auth-service"
import {DateTimeService} from '../infra/date-time-service'
import {IdGenerator} from '../infra/id-generator'

interface SessionsService {
  createSession: () => Promise<string>
  addPlayer: (sessionId: string) => Promise<string>
  moveToNextRound: (sessionId: string) => Promise<Session>
}

interface CreateSessionsServiceParams {
  sessionsRepo: SessionsRepo
  questionsRepo: QuestionsRepo
  idGenerator: IdGenerator
  dateTimeServie: DateTimeService
  responsesRepo: ResponsesRepo
  authService: AuthService
}
const MAX_QUESTIONS_PER_SESSION = 10

export const createSessionsService = (params: CreateSessionsServiceParams): SessionsService => {
  const { authService, dateTimeServie, responsesRepo, questionsRepo, sessionsRepo, idGenerator } = params
  const createSession = async () => {
    const id = idGenerator()
    const questions = await questionsRepo.getRandomQuestions(MAX_QUESTIONS_PER_SESSION)
    const session = SessionModel.createSession({ id, questions })
    const newPlayer = idGenerator()

    const sessionWithPlayer = SessionModel.addPlayer(session, { playerId: newPlayer })
    await sessionsRepo.saveSession(sessionWithPlayer)

    const playerToken = authService.createSessionToken(sessionWithPlayer.id, newPlayer)
    return playerToken
  }

  const addPlayer = async (sessionId: string): Promise<string> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new Error("Session not found")
    }
    if (!SessionModel.isSessionNew(session)) {
      throw new Error("session is in progress or over")
    }
    const playerId = idGenerator()
    const newSession = SessionModel.addPlayer(session, { playerId })
    const playerToken = authService.createSessionToken(sessionId, playerId)

    if (SessionModel.canStartSession(newSession)) {
      const inProgressSession = SessionModel.startSession(newSession, { date: dateTimeServie.now() })
      await sessionsRepo.saveSession(inProgressSession)
    } else {
      await sessionsRepo.saveSession(newSession)
    }
    return playerToken
  }


  const moveToNextRound = async (sessionId: string): Promise<Session> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new Error("Session not found")
    }

    if (!SessionModel.isSessionInProgress(session) || !SessionModel.shouldMoveToNextRound(session)) {
      return session
    }

    // eliminate disqualified users who haven't answered
    const responses = await responsesRepo.getSessionRoundResponses(session.id, session.currentRound)
    const activeQuestionId = SessionModel.activeQuestion(session)
    const activeQuestion = await questionsRepo.getQuestion(activeQuestionId)
    if (!activeQuestion) {
      throw new Error("Question not found")
    }

    const preNewReoundSession = SessionModel.eliminateDisqualifedPlayers(session, activeQuestion, responses)
    if (SessionModel.isGameOver(preNewReoundSession)) {
      const gameOverSession = SessionModel.endSession(preNewReoundSession)
      await sessionsRepo.saveSession(gameOverSession)
      return gameOverSession
    } else {
      const nextRoundSession = SessionModel.moveToNextRound(preNewReoundSession, { date: dateTimeServie.now() })
      await sessionsRepo.saveSession(nextRoundSession)
      return nextRoundSession
    }
  }

  return { addPlayer, createSession, moveToNextRound }
}
