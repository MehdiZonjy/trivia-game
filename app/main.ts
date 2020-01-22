import { createSessionsService } from './services/sessions-service'
import { createAuthService, PlayerIdentity } from './services/auth-service'
import { createResponsesSession } from './services/responses-service'
import { createDateTimeService } from './infra/date-time-service'
import { idGenerator } from './infra/id-generator'
import * as InMemoryQuestionsRepo from './repositories/inmemory/questions-repo'
import * as InMemoryResponsesReop from './repositories/inmemory/responses-repo'
import * as InMemorySessionsRepo from './repositories/inmemory/sessions-repo'

import * as DynamodbQuestionsRepo from './repositories/dynamodb/questions-repo'
import * as DynamodbResponsesReop from './repositories/dynamodb/responses-repo'
import * as DynamodbSessionsRepo from './repositories/dynamodb/sessions-repo'

import {QuestionsRepo, ResponsesRepo, SessionsRepo} from './repositories/types'

import createApp from 'express'
import JWTExpress from 'express-jwt'
import * as SubmitAnswerRequestValidator from './validators/submit-answer-request'
import BodyParser from 'body-parser'
import * as QuestionsSample from './questions'
import { ResourceNotFound, InvalidState } from './services/errors'
import { Request as ExpRequest, Response as ExpResponse } from 'express'
import * as Logger from './utils/logger'
import { createGameController } from './game-controller'
import {getConfig} from './config'
import * as AWS from 'aws-sdk'


const createRepos = (dynamodbEndpoint?: string): [QuestionsRepo, ResponsesRepo, SessionsRepo] => {
  if(dynamodbEndpoint) {
    console.log('using dynamodb storage')
    const client = new AWS.DynamoDB.DocumentClient({
      endpoint: dynamodbEndpoint,
      region: 'us-west-2'
    })
    return [DynamodbQuestionsRepo.createRepo(client), DynamodbResponsesReop.createRepo(client), DynamodbSessionsRepo.createRepo(client)]
  } else {
    console.log('using in memory storage')
    return [InMemoryQuestionsRepo.createRepo(), InMemoryResponsesReop.createRepo(), InMemorySessionsRepo.createSessionsRepo()]
  }
}

const main = async () => {
  const conf = getConfig()
  

  const [questionsRepo, responsesRepo, sessionsRepo] = createRepos(conf.dynamodbEndpoint)
  const authService = createAuthService({ jwtSecret: conf.jwtSecret })
  const dateTimeService = createDateTimeService()
  const responsesService = createResponsesSession({ responsesRepo, sessionsRepo, questionsRepo })
  const logger = Logger.createConsoleLogger()
  const submitResponseValidator = SubmitAnswerRequestValidator.createValidator(logger)
  //load test data
  await Promise.all(QuestionsSample.Data.map(questionsRepo.saveQuestion))

  const sessionsService = createSessionsService({
    questionsRepo,
    responsesRepo,
    sessionsRepo,
    idGenerator,
    dateTimeService,
    logger
  })

  const jwtMiddleware = JWTExpress({ secret: conf.jwtSecret })

  const gameController = createGameController({ logger, sessionsService, sessionsRepo })
  gameController.start()

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

  app.post('/sessions/submitAnswer', jwtMiddleware, async (req, res, next) => {
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

  app.get('/me', jwtMiddleware, async (req, res, next) => {
    try {
      const tokenPayload: PlayerIdentity | undefined = (req as any).user
      if (!tokenPayload) {
        res.status(401)
        return res.send('invalid token')
      }
      const { playerId, sessionId } = tokenPayload
      const playerState = await sessionsService.playerState(sessionId, playerId)
      res.send(playerState)
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

  app.get('/sessions/:sessionId/rounds/:round(\\d+)', async (req, res, next) => {
    try {
      const { sessionId, round } = req.params
      const roundStats = await responsesService.roundStats(sessionId, Number.parseInt(round))
      res.send(roundStats)
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


  app.listen(8080, (err) => {
    if(err){
      console.error(err)
    } else {
      console.log('listening')
    }
  })


  app.get('/', (res, req) => {
    req.send(`<html>
    <head>
      <title>Trivia | Mzmuse</title>
    </head>
    <body>
    <p>
      Welcome to this simple implementation of Trivia game.<br/>
      To get started just launch the client.<br/>
      docker run -it --rm mehdizonjy/trivia-client "https://trivia.mzmuse.com" <br/>
      Source code available at <a href="https://github.com/MehdiZonjy/trivia-game">Github</a>
    </p>
    <body>
    </html>`)
  })
}

main()