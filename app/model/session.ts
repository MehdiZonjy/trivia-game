import * as _ from 'lodash'
import * as QuestionModel from './question'
import { Response } from './response'
export enum SessionState {
  newSession = "newSession", // session was just created and pending for players to join 
  inProgress = "inProgress", // waiting 
  over = "over"
}

export type Session = NewSession | FinishedSession | InProgressSession

export interface InProgressSession {
  id: string
  currentRound: number
  questions: string[]
  players: Player[]
  roundStartedAt: Date
  state: SessionState.inProgress
}

export interface Player {
  playerId: string
  disqualified: boolean
}

export interface FinishedSession {
  id: string
  winner?: string
  state: SessionState.over
}
export interface NewSession {
  id: string
  state: SessionState.newSession
  questions: string[]
  players: Player[]
}


export const ROUND_DIRATION = 10 * 1000 // 10 seconds
export const START_SESSION_THRESHOLD = 2

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
  state: SessionState.newSession,
  questions: cmd.questions,
  players: [],
})

export const isSessionNew = (session: Session): session is NewSession => session.state === SessionState.newSession
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

export const endSession = (session: InProgressSession): FinishedSession => {
  const winner = session.players.filter(p => !p.disqualified)[0]
  return {
    id: session.id,
    winner: winner && winner.playerId,
    state: SessionState.over
  }
}

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
    players: [...session.players, {playerId: cmd.playerId, disqualified: false}],
  }
}



export const eliminatePlayer = (session: InProgressSession, cmd: EliminatePlayerCmd): InProgressSession => {
  const players = session.players.map(p => {
    if(p.playerId === cmd.playerId)
      return {...p, disqualified: true}
    return p
  })
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
  const idlePlayers = session.players.filter(p => activePlayers.indexOf(p.playerId) < 0).map(p => p.playerId)

  const disqualifiedPlayers = idlePlayers.concat(playersWithInvalidResponses)

  const newSession = disqualifiedPlayers.reduce((session, playerId) => eliminatePlayer(session, { playerId }), session)

  return newSession
}

export const isGameOver = (session: InProgressSession): boolean => session.players.filter( p => !p.disqualified).length <= 1

export const canStartSession = (session: NewSession): boolean => session.players.length >= START_SESSION_THRESHOLD



export enum PlayerState {
  Qualified,
  Disqualified,
  NotPartOfSession
}
export const getPlayerState = (session: InProgressSession, playerId: string) => {
  const player= session.players.find( p => p.playerId === playerId)
  if (!player){
    return PlayerState.NotPartOfSession
  }

  return player.disqualified ? PlayerState.Disqualified: PlayerState.Qualified
}