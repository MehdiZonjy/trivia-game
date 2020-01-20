export enum SessionState {
  pendingPlayersToJoin = "pendingPlayersToJoin", // session was just created and pending for players to join 
  newRound = "newRound", // move to next round 
  waitingForResponses = "waitingForResponses", // waiting 
  over = "over"
}

export interface Session {
  id: string
  updateDate: Date
  state: SessionState
  currentRound: number
  questionsShift: number
}


export const ROUND_DIRATION = 10 * 1000 // 10 seconds

export interface CreateSessionCMD {
  questionsShift: number
  id: string
  type: 'CREATE_SESSION'
}

export interface MoveToNextRoundCmd {
  type: 'NEXT_ROUND',
  date: Date
}



export const createSession = (cmd: CreateSessionCMD): Session => ({
  id: cmd.id,
  updateDate: new Date(),
  currentRound: -1,
  state: SessionState.pendingPlayersToJoin,
  questionsShift: cmd.questionsShift
})


export const moveToNextRound = (session: Session, cmd: MoveToNextRoundCmd): Session => ({
  ...session,
  updateDate: new Date(),
  currentRound: session.currentRound + 1,
})

export const shouldMoveToNextRound = (session: Session) => {
  const now = new Date()
  return (session.state === SessionState.waitingForResponses &&
    now.valueOf() > session.updateDate.valueOf() + ROUND_DIRATION)
} 

