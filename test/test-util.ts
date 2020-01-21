import * as Faker from 'faker'
import { Session, SessionState, NewSession, InProgressSession } from '../app/model/session'
import { } from '../app/model/response'
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