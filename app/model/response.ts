export interface Response {
  playerId: string
  sessionId: string
  round: number
  answerId: string
  questionId: string
}




interface CreatePlayerCmd {
  playerId: string
  sessionId: string
  round: number
  answerId: string,
  questionId: string
}


export const createResponse = ({answerId,playerId,round,sessionId, questionId}: CreatePlayerCmd): Response => ({
  answerId,
  playerId,
  round,
  sessionId,
  questionId
})
