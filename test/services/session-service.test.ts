import {createSessionsService} from '../../app/services/sessions-service'
import * as TestUtils from '../test-util'
import * as Faker from 'faker'
import * as _ from 'lodash'
import { SessionState } from '../../app/model/session'
import {createAuthService} from '../../app/services/auth-service'
import {idGenerator} from '../../app/infra/id-generator'

const logger = TestUtils.logger()
describe('sessions-service', ()=>{
  describe('createSession', ()=>{
    it('should create a new session', async ()=>{
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
        idGenerator,
        questionsRepo,
        sessionsRepo,
        dateTimeService: TestUtils.createDateTimeService({}),
        responsesRepo: TestUtils.createResponsesRepo({}),
        logger
      })

      const sessionCreated = await svc.createSession()

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        id: sessionId,
        state: SessionState.newSession,
        questions,
        players: [{playerId, disqualified: false}]
      })

      expect(sessionCreated).toEqual({
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
        idGenerator,
        questionsRepo: TestUtils.createQuestionsRepo({}),
        sessionsRepo,
        dateTimeService: TestUtils.createDateTimeService({}),
        responsesRepo: TestUtils.createResponsesRepo({}),
        logger
      })

      const playerAdded = await svc.addPlayer(newSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        ...newSession,
        players: [...newSession.players, {playerId, disqualified: false}]
      })

      expect(playerAdded).toEqual({
        playerId,
        sessionId: newSession.id,
        sessionState: SessionState.newSession,
        playersCount: newSession.players.length + 1
      })
    })
    it('should add a new player and start game when there are enough players', async ()=>{
      const newSession = TestUtils.createNewSession({
        players: _.range(1,50).map( n => Faker.random.uuid())
      })

      const roundStartedAt = new Date()
      const dateTimeService = TestUtils.createDateTimeService({
        now: jest.fn().mockReturnValueOnce(roundStartedAt)
      })

      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true),
        getSession: jest.fn().mockResolvedValue(newSession)
      })

      const playerId = Faker.random.uuid()
      const idGenerator = jest.fn().mockReturnValueOnce(playerId)


      const svc = createSessionsService({
        idGenerator,
        questionsRepo: TestUtils.createQuestionsRepo({}),
        sessionsRepo,
        dateTimeService,
        responsesRepo: TestUtils.createResponsesRepo({}),
        logger
      })

      const playerAddedToSession = await svc.addPlayer(newSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        id: newSession.id,
        currentRound: 0,
        questions: newSession.questions,
        players: [...newSession.players, {playerId, disqualified: false}],
        roundStartedAt,
        state: SessionState.inProgress
      })

      expect(playerAddedToSession).toEqual({
        playerId,
        sessionId: newSession.id,
        sessionState: SessionState.inProgress,
        playersCount: newSession.players.length + 1
      })
    })
  })

  describe('moveToNextRound', ()=>{
    it('should eliminate inactive players and those with invalid answers, then advance round', async ()=>{
      const inactivePlayer = Faker.random.uuid()
      const playerWhoAnsweredCorrectly1 = Faker.random.uuid()
      const playerWhoAnsweredCorrectly2 = Faker.random.uuid()
      const playerWhoAnsweredInCorrectly = Faker.random.uuid()
      const question = TestUtils.createQuestion({})
      const inProgressSession = TestUtils.createInProgressSession({
        questions: [question.id],
        roundStartedAt: Faker.date.past(),
        qualifiedPlayers: [inactivePlayer, playerWhoAnsweredCorrectly1, playerWhoAnsweredCorrectly2],
      })

      const invalidResponse = TestUtils.createResponse({
        sessionId: inProgressSession.id,
        answerId: question.answers[1].id,
        round: inProgressSession.currentRound,
        playerId: playerWhoAnsweredInCorrectly
      })

      const validResponse1 = TestUtils.createResponse({
        sessionId: inProgressSession.id,
        answerId: question.answers[0].id,
        round: inProgressSession.currentRound,
        playerId: playerWhoAnsweredCorrectly1
      })

      const validResponse2 = TestUtils.createResponse({
        sessionId: inProgressSession.id,
        answerId: question.answers[0].id,
        round: inProgressSession.currentRound,
        playerId: playerWhoAnsweredCorrectly2
      })


      //setup sessions repo
      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true),
        getSession: jest.fn().mockResolvedValue(inProgressSession)
      })

      // setup questions repo
      const questionsRepo = TestUtils.createQuestionsRepo({
        getQuestion: jest.fn().mockResolvedValue(question)
      })

      const responsesRepo = TestUtils.createResponsesRepo({
        getSessionRoundResponses: jest.fn().mockResolvedValue([invalidResponse, validResponse1, validResponse2])
      })

      const now = new Date()
      const dateTimeService = TestUtils.createDateTimeService({
        now: jest.fn().mockReturnValue(now)
      })


      const svc = createSessionsService({
        idGenerator: jest.fn(),
        questionsRepo,
        sessionsRepo,
        dateTimeService,
        responsesRepo,
        logger
      })

      await svc.moveToNextRound(inProgressSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        ...inProgressSession,
        currentRound: inProgressSession.currentRound + 1,
        players: [
          TestUtils.createDisqualifiedPlayer(inactivePlayer),
          TestUtils.createQualifiedPlayer(playerWhoAnsweredCorrectly1), 
          TestUtils.createQualifiedPlayer(playerWhoAnsweredCorrectly2)],
        roundStartedAt: now
      })

    })

    it('should eliminate disqualifed players and end game if there is only a single player remaining', async ()=>{
      const inactivePlayer = Faker.random.uuid()
      const playerWhoAnsweredCorrectly = Faker.random.uuid()
      const playerWhoAnsweredInCorrectly = Faker.random.uuid()
      const question = TestUtils.createQuestion({})
      const inProgressSession = TestUtils.createInProgressSession({
        questions: [question.id],
        roundStartedAt: Faker.date.past(),
        qualifiedPlayers: [inactivePlayer, playerWhoAnsweredCorrectly, playerWhoAnsweredInCorrectly]
      })

      const invalidResponse = TestUtils.createResponse({
        sessionId: inProgressSession.id,
        answerId: question.answers[1].id,
        round: inProgressSession.currentRound,
        playerId: playerWhoAnsweredInCorrectly
      })

      const validResponse = TestUtils.createResponse({
        sessionId: inProgressSession.id,
        answerId: question.answers[0].id,
        round: inProgressSession.currentRound,
        playerId: playerWhoAnsweredCorrectly
      })

      //setup sessions repo
      const sessionsRepo = TestUtils.createSessionsRepo({
        saveSession: jest.fn().mockResolvedValue(true),
        getSession: jest.fn().mockResolvedValue(inProgressSession)
      })

      // setup questions repo
      const questionsRepo = TestUtils.createQuestionsRepo({
        getQuestion: jest.fn().mockResolvedValue(question)
      })

      const responsesRepo = TestUtils.createResponsesRepo({
        getSessionRoundResponses: jest.fn().mockResolvedValue([invalidResponse, validResponse])
      })

      const now = new Date()
      const dateTimeService = TestUtils.createDateTimeService({
        now: jest.fn().mockReturnValue(now)
      })


      const svc = createSessionsService({
        idGenerator: jest.fn(),
        questionsRepo,
        sessionsRepo,
        dateTimeService,
        responsesRepo,
        logger
      })

      await svc.moveToNextRound(inProgressSession.id)

      expect(sessionsRepo.saveSession).toHaveBeenCalledWith({
        id: inProgressSession.id,
        winner: playerWhoAnsweredCorrectly,
        state: SessionState.over
      })
    })
  })

})