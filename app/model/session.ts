import * as _ from 'lodash'

export enum SessionState {
  pendingPlayersToJoin = "pendingPlayersToJoin", // session was just created and pending for players to join 
  inProgress = "inProgress", // waiting 
  over = "over"
}

export type Session = NewSession | FinishedSession | InProgressSession

interface InProgressSession {
  id: string
  currentRound: number
  questions: string[]
  players: string[]
  roundStartedAt: Date
  state: SessionState.inProgress
}

interface FinishedSession {
  id: string
  questions: string[]
  players: string[]
  state: SessionState.over
}
interface NewSession {
  id: string
  state: SessionState.pendingPlayersToJoin
  questions: string[]
  players: string[]
}


export const ROUND_DIRATION = 10 * 1000 // 10 seconds

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

export const createSession = (cmd: CreateSessionCmd): Session => ({
  id: cmd.id,
  state: SessionState.pendingPlayersToJoin,
  questions: cmd.questions,
  players: [],
})

export const startSession = (session: Session, cmd: StartSessionCmd): Session => {
  if (session.state !== SessionState.pendingPlayersToJoin) {
    throw new Error("Session has started or is over")
  }
  return {
    ...session,
    currentRound: 0,
    state: SessionState.inProgress,
    roundStartedAt: cmd.date
  }
}

export const moveToNextRound = (session: Session, cmd: MoveToNextRoundCmd): Session => {
  if (session.state !== SessionState.inProgress) {
    throw new Error("Session is not in progress")
  }
  return {
    ...session,
    state: SessionState.inProgress,
    roundStartedAt: cmd.date,
    currentRound: session.currentRound + 1,
  }
}

export const shouldMoveToNextRound = (session: Session) => {

  const now = new Date()
  return (session.state === SessionState.inProgress &&
    now.valueOf() > session.roundStartedAt.valueOf() + ROUND_DIRATION)
}

export const addPlayer = (session: Session, cmd: AddPlayerToSessionCmd): Session => {
  if (session.state !== SessionState.pendingPlayersToJoin) {
    throw new Error("Session has started or is over")
  }
  return {
    ...session,
    players: [...session.players, cmd.playerId],
  }
}



export const eliminatePlayer = (session: Session, cmd: EliminatePlayerCmd): Session => {
  if (session.state !== SessionState.inProgress) {
    throw new Error("Session is not in progress")
  }

  const players = [...session.players]
  _.remove(players, p => p === cmd.playerId)
  return {
    ...session,
    players
  }
}