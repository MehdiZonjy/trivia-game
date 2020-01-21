import { createSessionsService } from './services/sessions-service'
import { createAuthService } from './services/auth-service'
import { createDateTimeService } from './infra/date-time-service'
import { idGenerator } from './infra/id-generator'
import * as QuestionsRepo from './repositories/inmemory/questions-repo'
import * as ResponsesReop from './repositories/inmemory/responses-repo'
import * as SessionsRepo from './repositories/inmemory/sessions-repo'
import createApp from 'express'


const main = () => {

  const questionsRepo = QuestionsRepo.createRepo()
  const responsesRepo = ResponsesReop.createRepo()
  const sessionsRepo = SessionsRepo.createSessionsRepo()
  const authService = createAuthService({ jwtSecret: 'change me ' })
  const dateTimeService = createDateTimeService()

  const sessionsService = createSessionsService({
    questionsRepo,
    responsesRepo,
    sessionsRepo,
    idGenerator,
    dateTimeService,
    authService
  })

  const app = createApp()


  app.post('/sessions', async (req, res) => {
    const { playerId, sessionId } = await sessionsService.createSession()
    const playerToken = authService.createSessionToken(sessionId, playerId)
    res.send({
      playerId,
      sessionId,
      playerToken
    })
  })


  app.post('/sessions/join', async (req, res) => {
    const { sessionId } = req.params
    const { playerId, sessionState } = await sessionsService.addPlayer(sessionId)
    const playerToken = authService.createSessionToken(sessionId, playerId)
    res.send({
      playerId,
      sessionId,
      playerToken,
      sessionState
    })
  })

  app.get('/sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params
    const session = await sessionsService.getSessionState(sessionId)
    res.send(session)
  })


  app.listen(8080, ()=> console.log('listening'))


}

main()