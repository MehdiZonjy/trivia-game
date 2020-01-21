import {createSessionsService} from '../../app/services/sessions-service'
import * as TestUtils from '../test-util'
import * as Faker from 'faker'
import * as _ from 'lodash'
import { SessionState } from '../../app/model/session'
import {createAuthService} from '../../app/services/auth-service'

const authService =  createAuthService({jwtSecret: "hello"})

describe('sessions-service', ()=>{
  describe('createSession', ()=>{
    it('should create a new session, and return a valid JWT for a player', async ()=>{
      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true)
      })

      const sessionId = Faker.random.uuid()
      const playerId = Faker.random.uuid()
      const questions = ["question1", "question2"]
      const idGenerator = jest.fn().mockReturnValueOnce(sessionId).mockReturnValueOnce(playerId)

      const questionsRepo = TestUtils.createQuestionsRepo({
        getRandomQuestions: jest.fn().mockResolvedValue(questions)
      })


      const svc = createSessionsService({
        authService,
        idGenerator,
        questionsRepo,
        sessionsRepo,
        dateTimeServie: TestUtils.createDateTimeService({}),
        responsesRepo: TestUtils.createResponsesRepo({})
      })

      const token = await svc.createSession()

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        id: sessionId,
        state: SessionState.pendingPlayersToJoin,
        questions,
        players: [playerId]
      })

      expect(authService.decodeSessionToken(token)).toEqual({
        playerId,
        sessionId
      })
    })
  })



  describe('addPlayer', ()=>{
    it('should add new player and keep session in NewSession state if there are not enough players', async ()=>{
      const newSession = TestUtils.createNewSession({})

      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true),
        getSession: jest.fn().mockResolvedValue(newSession)
      })

      const playerId = Faker.random.uuid()
      const idGenerator = jest.fn().mockReturnValueOnce(playerId)


      const svc = createSessionsService({
        authService,
        idGenerator,
        questionsRepo: TestUtils.createQuestionsRepo({}),
        sessionsRepo,
        dateTimeServie: TestUtils.createDateTimeService({}),
        responsesRepo: TestUtils.createResponsesRepo({})
      })

      const token = await svc.addPlayer(newSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        ...newSession,
        players: [...newSession.players, playerId]
      })

      expect(authService.decodeSessionToken(token)).toEqual({
        playerId,
        sessionId: newSession.id
      })
    })
    it('should add a new player and start game when there are enough players', async ()=>{
      const newSession = TestUtils.createNewSession({
        players: _.range(1,50).map( n => Faker.random.uuid())
      })

      const roundStartedAt = new Date()
      const dateTimeServie = TestUtils.createDateTimeService({
        now: jest.fn().mockReturnValueOnce(roundStartedAt)
      })

      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true),
        getSession: jest.fn().mockResolvedValue(newSession)
      })

      const playerId = Faker.random.uuid()
      const idGenerator = jest.fn().mockReturnValueOnce(playerId)


      const svc = createSessionsService({
        authService,
        idGenerator,
        questionsRepo: TestUtils.createQuestionsRepo({}),
        sessionsRepo,
        dateTimeServie,
        responsesRepo: TestUtils.createResponsesRepo({})
      })

      const token = await svc.addPlayer(newSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        id: newSession.id,
        currentRound: 0,
        questions: newSession.questions,
        players: [...newSession.players, playerId],
        roundStartedAt,
        state: SessionState.inProgress
      })

      expect(authService.decodeSessionToken(token)).toEqual({
        playerId,
        sessionId: newSession.id
      })
    })
  })

  describe('moveToNextRound', ()=>{
    it('should eliminate inactive players and those with invalid answes, then move to next round', ()=>{

    })

    it('should eliminate disqualifed players and end game if there is only a single player remaining', ()=>{

    })
  })
})