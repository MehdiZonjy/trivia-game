import * as JWT from 'jsonwebtoken'
export interface AuthService {
  createSessionToken: (sessionId: string, playerId: string) => string
  decodeSessionToken: (token: string) => PlayerIdentity | undefined
}


interface CreateAuthServiceParams {
  jwtSecret: string
}

export interface PlayerIdentity {
  sessionId: string
  playerId: string
}
const createPayload = (sessionId: string, playerId: string): PlayerIdentity => ({
  sessionId,
  playerId
})
const TOKEN_DURATION = 60 * 60

export const createAuthService = ({ jwtSecret }: CreateAuthServiceParams): AuthService => {
  const createSessionToken = (sessionId: string, playerId: string): string => {
    const token = JWT.sign(createPayload(sessionId, playerId), jwtSecret, {
      expiresIn: TOKEN_DURATION
    })
    return token
  }


  const decodeSessionToken = (token: string): PlayerIdentity => {
    try {
      const payload = JWT.verify(token, jwtSecret) as any
      if (typeof payload === 'string' || !payload.sessionId || !payload.playerId) {
        throw new Error("Invalid Token")
      }
      return {playerId: payload.playerId, sessionId: payload.sessionId}
    } catch (err) {
      throw new Error("Invalid Token")
    }
  }
  return {createSessionToken, decodeSessionToken}
}

