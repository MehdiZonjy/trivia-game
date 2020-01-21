export interface Response {
  playerId: string
  sessionId: string
  round: number
  answerId: string
}




interface CreatePlayerCmd {
  playerId: string
  sessionId: string
  round: number
  answerId: string
}


const createResponse = ({answerId,playerId,round,sessionId}: CreatePlayerCmd): Response => ({
  answerId,
  playerId,
  round,
  sessionId
})
