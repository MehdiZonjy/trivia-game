import * as Faker from 'faker'
import { Session, SessionState, NewSession, InProgressSession } from '../app/model/session'
import {Response } from '../app/model/response'
import { SessionsRepo, QuestionsRepo, ResponsesRepo } from '../app/repositories/types'
import { Question } from '../app/model/question'
import { DateTimeService } from '../app/infra/date-time-service'
interface CreateNewSessionParams {
  id?: string
  players?: string[]
  questions?: string[]
}

export const createNewSession = ({
  id = Faker.random.uuid(),
  players = [Faker.random.uuid(), Faker.random.uuid()],
  questions = [Faker.random.uuid(), Faker.random.uuid()]
}: CreateNewSessionParams): NewSession => ({
  id,
  state: SessionState.pendingPlayersToJoin,
  players,
  questions
})


interface CreateInProgressSessionParams {
  id?: string
  currentRound?: number
  questions?: string[]
  players?: string[]
  roundStartedAt?: Date
}


export const createInProgressSession = ({
  roundStartedAt = new Date(),
  players = [],
  questions = [],
  currentRound = 0 }: CreateInProgressSessionParams): InProgressSession => ({
    id: Faker.random.uuid(),
    currentRound,
    questions: questions,
    players: players,
    roundStartedAt,
    state: SessionState.inProgress
  })


interface CreateResponseParams {
  playerId?: string
  sessionId?: string
  round?: number
  answerId?: string
}
export const createResponse = ({
  answerId = Faker.random.uuid(),
  playerId = Faker.random.uuid(),
  round = Faker.random.number(),
  sessionId = Faker.random.uuid()
}: CreateResponseParams) => ({
  playerId,
  sessionId,
  round,
  answerId
})



interface CreateSessionsRepoParams {
  saveSession?: (Session: Session) => Promise<boolean>
  getSession?: (id: string) => Promise<Session | undefined>
}

export const createSessionsRepo = ({
  getSession = jest.fn(),
  saveSession = jest.fn()
}: CreateSessionsRepoParams): SessionsRepo => ({
  getSession,
  saveSession
})


interface CreateQuestionsRepoParams {
  saveQuestion?: (question: Question) => Promise<boolean>
  getQuestion?: (id: string) => Promise<Question | undefined>
  getQuestionsCount?: () => Promise<number>
  getRandomQuestions?: (count: number) => Promise<string[]>
}

export const createQuestionsRepo = ({
  getQuestion = jest.fn(),
  getQuestionsCount = jest.fn(),
  getRandomQuestions = jest.fn(),
  saveQuestion = jest.fn()
}: CreateQuestionsRepoParams): QuestionsRepo => ({
  getQuestion,
  getQuestionsCount,
  getRandomQuestions,
  saveQuestion
})


interface CreateResponsesRepoParams {
  saveResponse?: (response: Response) => Promise<boolean>
  getSessionRoundResponses?: (sessionId: string, round: number) => Promise<Response[]>
}

export const createResponsesRepo = ({
  getSessionRoundResponses = jest.fn(),
  saveResponse = jest.fn()
}: CreateResponsesRepoParams): ResponsesRepo => ({
  saveResponse,
  getSessionRoundResponses
})



interface CreateDateTimeServiceParams {
  now?: () => Date
}

export const createDateTimeService = ({
now = jest.fn()
}: CreateDateTimeServiceParams): DateTimeService => ({
  now
})