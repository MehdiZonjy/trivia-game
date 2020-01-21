import { Session, SessionState } from "../model/session";
import { SessionsRepo, QuestionsRepo, ResponsesRepo } from "../repositories/types";
import * as SessionModel from '../model/session'
import { AuthService } from "./auth-service"
import { DateTimeService } from '../infra/date-time-service'
import { IdGenerator } from '../infra/id-generator'
import { Question } from "../model/question";

interface SessionsService {
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
  question: Question
  round: number
  remainingPlayers: number
  state: SessionState.inProgress
}
interface NewSessionDTO {
  sessionId: string
  playersCount: number
  state: SessionState.pendingPlayersToJoin
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
  authService: AuthService
}
const MAX_QUESTIONS_PER_SESSION = 10

export const createSessionsService = (params: CreateSessionsServiceParams): SessionsService => {
  const { authService, dateTimeService, responsesRepo, questionsRepo, sessionsRepo, idGenerator } = params
  const createSession = async (): Promise<SessionCreated> => {
    const sessionId = idGenerator()
    const questions = await questionsRepo.getRandomQuestions(MAX_QUESTIONS_PER_SESSION)
    const session = SessionModel.createSession({ id: sessionId, questions })
    const playerId = idGenerator()

    const sessionWithPlayer = SessionModel.addPlayer(session, { playerId: playerId })
    await sessionsRepo.saveSession(sessionWithPlayer)

    return { playerId, sessionId }
  }

  const addPlayer = async (sessionId: string): Promise<PlayerAddedToSession> => {
    const session = await sessionsRepo.getSession(sessionId)
    if (!session) {
      throw new Error("Session not found")
    }
    if (!SessionModel.isSessionNew(session)) {
      throw new Error("session is in progress or over")
    }
    const playerId = idGenerator()
    const newSession = SessionModel.addPlayer(session, { playerId })

    if (SessionModel.canStartSession(newSession)) {
      const inProgressSession = SessionModel.startSession(newSession, { date: dateTimeService.now() })
      await sessionsRepo.saveSession(inProgressSession)
      return { playerId, sessionId, sessionState: inProgressSession.state }
    } else {
      await sessionsRepo.saveSession(newSession)
      return { playerId, sessionId, sessionState: newSession.state }
    }

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
      const nextRoundSession = SessionModel.moveToNextRound(preNewReoundSession, { date: dateTimeService.now() })
      await sessionsRepo.saveSession(nextRoundSession)
      return nextRoundSession
    }
  }



  const getSessionState = async (sessionId: string): Promise<SessionStateDTO> => {
    const session = await sessionsRepo.getSession(sessionId)

    if (!session) {
      throw new Error("Session not found")
    }

    switch (session.state) {
      case SessionState.pendingPlayersToJoin: {
        return {
          state: SessionState.pendingPlayersToJoin,
          sessionId: session.id,
          playersCount: session.players.length // TODO fix me
        }
      }
      case SessionState.inProgress: {
        const activeQuestion = await questionsRepo.getQuestion(SessionModel.activeQuestion(session))
        if (!activeQuestion) {
          throw new Error("Question not found")
        }

        return {
          state: SessionState.inProgress,
          round: session.currentRound,
          sessionId: session.id,
          question: activeQuestion,
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
