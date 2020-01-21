import {PlayerIdentity, createAuthService} from '../../app/services/auth-service'
describe('auth-service', ()=>{
  const svc = createAuthService({jwtSecret: 'secret'})
  it('should encode and decode successfully', ()=>{
    const sessionId = 'session1'
    const playerId = 'player1'

    const token = svc.createSessionToken(sessionId, playerId)
    expect(svc.decodeSessionToken(token)).toEqual({
      sessionId,
      playerId
    })
  })
})