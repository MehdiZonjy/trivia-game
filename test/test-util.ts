import * as Faker from 'faker'
import { Session, SessionState, NewSession, InProgressSession, Player } from '../app/model/session'
import { Response } from '../app/model/response'
import { SessionsRepo, QuestionsRepo, ResponsesRepo } from '../app/repositories/types'
import { Question, Answer } from '../app/model/question'
import { DateTimeService } from '../app/infra/date-time-service'
import { Logger } from '../app/utils/logger'
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
  state: SessionState.newSession,
  players: players.map(createQualifiedPlayer),
  questions
})


interface CreateInProgressSessionParams {
  id?: string
  currentRound?: number
  questions?: string[]
  qualifiedPlayers?: string[]
  disqualifiedPlayers?: string[]
  roundStartedAt?: Date
}


export const createInProgressSession = ({
  roundStartedAt = new Date(),
  qualifiedPlayers = [],
  disqualifiedPlayers = [],
  questions = [],
  currentRound = 0 }: CreateInProgressSessionParams): InProgressSession => ({
    id: Faker.random.uuid(),
    currentRound,
    questions: questions,
    players: [...qualifiedPlayers.map(createQualifiedPlayer), ...disqualifiedPlayers.map(createDisqualifiedPlayer)],
    roundStartedAt,
    state: SessionState.inProgress
  })


interface CreateResponseParams {
  playerId?: string
  sessionId?: string
  round?: number
  answerId?: string
  questionId?: string
}
export const createResponse = ({
  answerId = Faker.random.uuid(),
  playerId = Faker.random.uuid(),
  round = Faker.random.number(),
  sessionId = Faker.random.uuid(),
  questionId = Faker.random.uuid()
}: CreateResponseParams) => ({
  playerId,
  sessionId,
  round,
  answerId,
  questionId
})



interface CreateSessionsRepoParams {
  saveSession?: (Session: Session) => Promise<boolean>
  getSession?: (id: string) => Promise<Session | undefined>
  getActiveSessions?: () => Promise<Session[]>
}

export const createSessionsRepo = ({
  getSession = jest.fn(),
  saveSession = jest.fn(),
  getActiveSessions = jest.fn()
}: CreateSessionsRepoParams): SessionsRepo => ({
  getSession,
  saveSession,
  getActiveSessions
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


interface CreateQuestionParms {
  id?: string
  answers?: Answer[]
}



export const createQuestion = ({
  id = Faker.random.uuid(),
  answers = [createAnswer({ isCorrect: true }), createAnswer({}), createAnswer({})]

}: CreateQuestionParms): Question => ({
  answers,
  id,
  text: Faker.random.words(3)
})


interface CreateAnswerParams {
  isCorrect?: boolean
}

export const createAnswer = ({ isCorrect = false }: CreateAnswerParams): Answer => ({
  id: Faker.random.uuid(),
  isCorrect,
  text: Faker.random.words(3)
})

export const createQualifiedPlayer = (playerId: string): Player => ({
  playerId,
  disqualified: false
})

export const createDisqualifiedPlayer = (playerId: string): Player => ({
  playerId,
  disqualified: true
})


export const logger = (): Logger => ({
  info: () =>({}),
  warn: () =>({}),
  debug: () =>({}),
  error: () =>({}),
})