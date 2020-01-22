import { Session, SessionState } from "../model/session";
import { SessionsRepo, QuestionsRepo, ResponsesRepo } from "../repositories/types";
import * as SessionModel from '../model/session'
import { DateTimeService } from '../infra/date-time-service'
import { IdGenerator } from '../infra/id-generator'
import { Question } from "../model/question";
import { Logger } from "../utils/logger";
import { ResourceNotFound, InvalidState } from "./errors";

export interface SessionsService {
  createSession: () => Promise<SessionCreated>
  addPlayer: (sessionId: string) => Promise<PlayerAddedToSession>
  moveToNextRound: (sessionId: string) => Promise<Session>
  getSessionState: (sessionId: string) => Promise<SessionStateDTO>
}

interface SessionCreated {
  sessionId: string
  playerId: string
}

interface PlayerAddedToSession {
  playerId: string
  sessionId: string
  playersCount: number
  sessionState: SessionState
}

interface InProgressSessionDTO {
  sessionId: string
  question: QuestionDTO
  round: number
  remainingPlayers: number
  state: SessionState.inProgress
}
interface QuestionDTO {
  id: string
  text: string
  answers: AnswerDTO[]
}

interface AnswerDTO {
  id: string,
  text: string
}
interface NewSessionDTO {
  sessionId: string
  playersCount: number
  state: SessionState.newSession
}

interface FinishedSessionDTO {
  sessionId: string
  winner?: string
  state: SessionState.over
}

export type SessionStateDTO = InProgressSessionDTO | NewSessionDTO | FinishedSessionDTO

interface CreateSessionsServiceParams {
  sessionsRepo: SessionsRepo
  questionsRepo: QuestionsRepo
  idGenerator: IdGenerator
  dateTimeService: DateTimeService
  responsesRepo: ResponsesRepo
  logger: Logger
}
const MAX_QUESTIONS_PER_SESSION = 10

export const createSessionsService = (params: CreateSessionsServiceParams): SessionsService => {
  const { dateTimeService, responsesRepo, questionsRepo, sessionsRepo, idGenerator, logger } = params
  const createSession = async (): Promise<SessionCreated> => {
    const sessionId = idGenerator()
    const questions = await questionsRepo.getRandomQuestions(MAX_QUESTIONS_PER_SESSION)
    const session = SessionModel.createSession({ id: sessionId, questions })
    const playerId = idGenerator()

    const sessionWithPlayer = SessionModel.addPlayer(session, { playerId: playerId })
    await sessionsRepo.saveSession(sessionWithPlayer)
    logger.info('created a new session', { sessionId, playerId })
    return { playerId, sessionId }
  }

  const addPlayer = async (sessionId: string): Promise<PlayerAddedToSession> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new ResourceNotFound("Session not found", sessionId)
    }
    if (!SessionModel.isSessionNew(session)) {
      throw new InvalidState("session is in progress or over", { sessionId, state: session.state })
    }
    const playerId = idGenerator()
    const newSession = SessionModel.addPlayer(session, { playerId })
    logger.info('added player to session', { sessionId, playerId })
    if (SessionModel.canStartSession(newSession)) {
      logger.info('Starting Session', { sessionId })
      const inProgressSession = SessionModel.startSession(newSession, { date: dateTimeService.now() })
      await sessionsRepo.saveSession(inProgressSession)
      return { playerId, sessionId, sessionState: inProgressSession.state, playersCount: inProgressSession.players.length }
    } else {
      logger.info('session needs more players', { sessionId, playersCount: newSession.players.length })
      await sessionsRepo.saveSession(newSession)
      return { playerId, sessionId, sessionState: newSession.state, playersCount: newSession.players.length }
    }

  }


  const moveToNextRound = async (sessionId: string): Promise<Session> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new ResourceNotFound("Session not found", sessionId)
    }

    if (!SessionModel.isSessionInProgress(session) || !SessionModel.shouldMoveToNextRound(session)) {
      return session
    }

    // eliminate disqualified users who haven't answered
    const responses = await responsesRepo.getSessionRoundResponses(session.id, session.currentRound)
    const activeQuestionId = SessionModel.activeQuestion(session)
    const activeQuestion = await questionsRepo.getQuestion(activeQuestionId)
    if (!activeQuestion) {
      throw new ResourceNotFound("Question not found", activeQuestionId)
    }

    const preNewReoundSession = SessionModel.eliminateDisqualifedPlayers(session, activeQuestion, responses)
    if (SessionModel.isGameOver(preNewReoundSession)) {
      const gameOverSession = SessionModel.endSession(preNewReoundSession)
      await sessionsRepo.saveSession(gameOverSession)
      return gameOverSession
    } else {
      const nextRoundSession = SessionModel.moveToNextRound(preNewReoundSession, { date: dateTimeService.now() })
      await sessionsRepo.saveSession(nextRoundSession)
      return nextRoundSession
    }
  }



  const getSessionState = async (sessionId: string): Promise<SessionStateDTO> => {
    const session = await sessionsRepo.getSession(sessionId)

    if (!session) {
      throw new ResourceNotFound("Session not found", sessionId)
    }

    switch (session.state) {
      case SessionState.newSession: {
        return {
          state: SessionState.newSession,
          sessionId: session.id,
          playersCount: session.players.length // TODO fix me
        }
      }
      case SessionState.inProgress: {
        const activeQuestionId = SessionModel.activeQuestion(session)
        const activeQuestion = await questionsRepo.getQuestion(activeQuestionId)
        if (!activeQuestion) {
          throw new ResourceNotFound("Question not found", activeQuestionId)
        }

        const question: QuestionDTO = {
          id: activeQuestion.id,
          text: activeQuestion.text,
          answers: activeQuestion.answers.map(ans => ({
            id: ans.id,
            text: ans.text
          }))
        }

        return {
          state: SessionState.inProgress,
          round: session.currentRound,
          sessionId: session.id,
          question,
          remainingPlayers: session.players.length//TODO fix me
        }
      }
      case SessionState.over: {
        return {
          state: SessionState.over,
          winner: session.winner,
          sessionId: session.id
        }
      }
    }

  }
  return { addPlayer, createSession, moveToNextRound, getSessionState }
}
