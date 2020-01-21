import * as _ from 'lodash'
import * as QuestionModel from './question'
import { Response } from './response'
export enum SessionState {
  pendingPlayersToJoin = "pendingPlayersToJoin", // session was just created and pending for players to join 
  inProgress = "inProgress", // waiting 
  over = "over"
}

export type Session = NewSession | FinishedSession | InProgressSession

export interface InProgressSession {
  id: string
  currentRound: number
  questions: string[]
  players: string[]
  roundStartedAt: Date
  state: SessionState.inProgress
}

export interface FinishedSession {
  id: string
  winner?: string
  state: SessionState.over
}
export interface NewSession {
  id: string
  state: SessionState.pendingPlayersToJoin
  questions: string[]
  players: string[]
}


export const ROUND_DIRATION = 10 * 1000 // 10 seconds
export const START_SESSION_THRESHOLD = 4

export interface CreateSessionCmd {
  questions: string[]
  id: string
}

export interface StartSessionCmd {
  date: Date
}
export interface MoveToNextRoundCmd {
  date: Date
}
export interface AddPlayerToSessionCmd {
  playerId: string
}
export interface EliminatePlayerCmd {
  playerId: string
}

export const createSession = (cmd: CreateSessionCmd): NewSession => ({
  id: cmd.id,
  state: SessionState.pendingPlayersToJoin,
  questions: cmd.questions,
  players: [],
})

export const isSessionNew = (session: Session): session is NewSession => session.state === SessionState.pendingPlayersToJoin
export const isSessionInProgress = (session: Session): session is InProgressSession => session.state === SessionState.inProgress
export const isSessionOver = (session: Session): session is FinishedSession => session.state === SessionState.over


export const startSession = (session: NewSession, cmd: StartSessionCmd): InProgressSession => {
  return {
    ...session,
    currentRound: 0,
    state: SessionState.inProgress,
    roundStartedAt: cmd.date
  }
}

export const endSession = (session: InProgressSession): FinishedSession => ({
  id: session.id,
  winner: session.players[0],
  state: SessionState.over
})

export const moveToNextRound = (session: InProgressSession, cmd: MoveToNextRoundCmd): InProgressSession => {

  return {
    ...session,
    state: SessionState.inProgress,
    roundStartedAt: cmd.date,
    currentRound: session.currentRound + 1,
  }
}

export const shouldMoveToNextRound = (session: InProgressSession): session is InProgressSession => {

  const now = new Date()
  return (session.state === SessionState.inProgress &&
    now.valueOf() > session.roundStartedAt.valueOf() + ROUND_DIRATION)
}

export const addPlayer = (session: NewSession, cmd: AddPlayerToSessionCmd): NewSession => {
  return {
    ...session,
    players: [...session.players, cmd.playerId],
  }
}



export const eliminatePlayer = (session: InProgressSession, cmd: EliminatePlayerCmd): InProgressSession => {
  const players = [...session.players]
  _.remove(players, p => p === cmd.playerId)
  return {
    ...session,
    players
  }
}

export const activeQuestion = (session: InProgressSession): string => {
  return session.questions[session.currentRound % session.questions.length]
}

export const eliminateDisqualifedPlayers = (session: InProgressSession, activeQuestion: QuestionModel.Question, responses: Response[]): InProgressSession => {
  const playersWithInvalidResponses = responses.filter(r => !QuestionModel.validateAnswer(activeQuestion, r.answerId)).map(p => p.playerId)

  const activePlayers = responses.map(p => p.playerId)
  const idlePlayers = session.players.filter(p => activePlayers.indexOf(p) < 0)

  const disqualifiedPlayers = idlePlayers.concat(playersWithInvalidResponses)

  const newSession = disqualifiedPlayers.reduce((session, playerId) => eliminatePlayer(session, { playerId }), session)

  return newSession
}

export const isGameOver = (session: InProgressSession): boolean => session.players.length <= 1

export const canStartSession = (session: NewSession): boolean => session.players.length >= START_SESSION_THRESHOLD
