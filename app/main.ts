import { createSessionsService } from './services/sessions-service'
import { createAuthService, PlayerIdentity } from './services/auth-service'
import { createResponsesSession } from './services/responses-service'
import { createDateTimeService } from './infra/date-time-service'
import { idGenerator } from './infra/id-generator'
import * as QuestionsRepo from './repositories/inmemory/questions-repo'
import * as ResponsesReop from './repositories/inmemory/responses-repo'
import * as SessionsRepo from './repositories/inmemory/sessions-repo'
import createApp from 'express'
import JWTExpress from 'express-jwt'
import * as SubmitAnswerRequestValidator from './validators/submit-answer-request'
import BodyParser from 'body-parser'
import * as QuestionsSample from './questions'
import { ResourceNotFound, InvalidState } from './services/errors'
import { Request as ExpRequest, Response as ExpResponse } from 'express'
import * as Logger from './utils/logger'
import { moveToNextRound } from './model/session'
const JWT_SECRET = 'chaneg me'

const main = async () => {

  const questionsRepo = QuestionsRepo.createRepo()
  const responsesRepo = ResponsesReop.createRepo()
  const sessionsRepo = SessionsRepo.createSessionsRepo()
  const authService = createAuthService({ jwtSecret: JWT_SECRET })
  const dateTimeService = createDateTimeService()
  const responsesService = createResponsesSession({ responsesRepo, sessionsRepo })
  const logger = Logger.createConsoleLogger()
  const submitResponseValidator = SubmitAnswerRequestValidator.createValidator(logger)
  //load test data
  await Promise.all(QuestionsSample.Data.map(q => questionsRepo.saveQuestion(q)))

  const sessionsService = createSessionsService({
    questionsRepo,
    responsesRepo,
    sessionsRepo,
    idGenerator,
    dateTimeService,
    logger
  })

  const app = createApp()

  app.use(BodyParser.json())

  app.post('/sessions', async (req, res, next) => {
    try {

      const { playerId, sessionId } = await sessionsService.createSession()
      const playerToken = authService.createSessionToken(sessionId, playerId)
      res.send({
        playerId,
        sessionId,
        playerToken
      })
      next()
    } catch (err) {
      next(err)
    }

  })


  app.post('/sessions/:sessionId/join', async (req, res, next) => {
    try {

      const { sessionId } = req.params
      const { playerId, sessionState } = await sessionsService.addPlayer(sessionId)
      const playerToken = authService.createSessionToken(sessionId, playerId)
      res.send({
        playerId,
        sessionId,
        playerToken,
        sessionState
      })
      next()
    } catch (err) {
      next(err)
    }


  })

  app.post('/sessions/submitAnswer', JWTExpress({ secret: JWT_SECRET }), async (req, res, next) => {
    try {

      const tokenPayload: PlayerIdentity | undefined = (req as any).user
      if (!tokenPayload) {
        res.status(401)
        return res.send('invalid token')
      }

      const { playerId, sessionId } = tokenPayload
      const unvalidatedAnswerRequest = req.body
      const { result: validatedAnswerRequest, error } = submitResponseValidator(unvalidatedAnswerRequest)
      if (!validatedAnswerRequest) {
        res.status(400)
        return res.send(error)
      }
      const { answerId, round, questionId } = validatedAnswerRequest
      await responsesService.submitResponse(sessionId, playerId, round, answerId, questionId)
      logger.info(`player submitted an answer`, { playerId, sessionId, answerId, round })
      res.send('submitted')
      next()
    } catch (err) {
      next(err)
    }
  })

  app.get('/sessions/:sessionId', async (req, res, next) => {
    try {

      const { sessionId } = req.params
      const session = await sessionsService.getSessionState(sessionId)
      res.send(session)
      next()
    } catch (err) {
      next(err)
    }

  })

  app.use((err: any, req: ExpRequest, res: ExpResponse, next: any) => {
    if (!err) {
      next()
    }
    if (err instanceof ResourceNotFound) {
      logger.warn(err)
      res.status(404)
      res.send(err.message)
      return
    }

    if (err instanceof InvalidState) {
      logger.warn(err)
      res.status(403)
      res.send(err.message)
      return
    }

    logger.error(err)
    res.status(500)
    res.send("Internal Error")

  })

  app.listen(8080, () => console.log('listening'))


}

main()