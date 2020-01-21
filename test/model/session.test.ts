import { SessionState, Session } from '../../app/model/session'
import * as SessionModel from '../../app/model/session'
import * as Faker from 'faker'
const createNewSession = (): Session => ({
  id: 'session1',
  state: SessionState.pendingPlayersToJoin,
  questions: [],
  players: []
})
const createInProgressSession = ({ roundStartedAt = new Date(), players = [], questions = [], currentRound = 0 }: { players?: string[], currentRound?: number, questions?: string[], roundStartedAt?: Date }): Session => ({
  id: 'session2',
  currentRound,
  questions: questions,
  players: players,
  roundStartedAt,
  state: SessionState.inProgress
})

describe('session model', () => {
  describe('createSession', () => {
    it('should create new session', () => {
      const id = 'session1'
      const questions = ['question1', 'question2']

      expect(SessionModel.createSession({ id, questions })).toEqual({
        id,
        state: SessionState.pendingPlayersToJoin,
        questions,
        players: []
      })
    })
  })

  describe('startSession', () => {
    it('should start a session', () => {
      const session = createNewSession()
      const now = new Date()
      expect(SessionModel.startSession(session, {
        date: now
      })).toEqual({
        id: session.id,
        currentRound: 0,
        questions: session.questions,
        players: session.players,
        roundStartedAt: now,
        state: SessionState.inProgress
      })
    })

    it('should fail if session is not pendingPlayerToJoin state', () => {
      const session = createInProgressSession({ players: [], questions: [] })
      expect(() => SessionModel.startSession(session, { date: new Date() })).toThrowError()
    })
  })

  describe('moveToNextRound', () => {
    it('shuold move to next round', () => {

      const currentRound = 3
      const session = createInProgressSession({ players: [], questions: [], currentRound })
      const now = new Date()
      expect(SessionModel.moveToNextRound(session, { date: now }))
        .toEqual({
          ...session,
          roundStartedAt: now,
          currentRound: currentRound + 1
        })
    })
    it('should fail if session is not inProgress state', () => {
      const session = createNewSession()
      expect(() => SessionModel.moveToNextRound(session, { date: new Date() })).toThrowError()
    })
  })

  describe('shouldMoveToNextRound', () => {
    it('should return true when roundStartedAt is past ROUND_DURATION', () => {

      const session = createInProgressSession({ roundStartedAt: Faker.date.past() })
      expect(SessionModel.shouldMoveToNextRound(session)).toBeTruthy()
    })
    it('should return false when roundStartedAt is less than ROUND_DURATION', () => {
      const session = createInProgressSession({roundStartedAt: new Date()})
      expect(SessionModel.shouldMoveToNextRound(session)).toBeFalsy()
    })
  })
  describe('addPlayer', ()=>{
    it('should fail if session is not in PendingPlayersToJoin state', ()=>{
      const session = createInProgressSession({})
      expect(()=>SessionModel.addPlayer(session, {playerId: 'hello'})).toThrowError()
    })
    it('should add player if in PendingPlayersToJoin state', ()=>{
      const session = createNewSession()
      expect(SessionModel.addPlayer(session, {playerId: 'player1'})).toEqual({
        ...session,
        players: ['player1']
      })
    })
  })

  describe('eliminatePlayer', ()=>{
    it('should fail if session is not inProgress', ()=>{
      const session = createNewSession()
      expect(()=> SessionModel.eliminatePlayer(session, {playerId: 'player'})).toThrowError()
    })
    it('should eliminate player from inProgress session', ()=>{
      const session = createInProgressSession({players: ['player1', 'player2']})
      expect(SessionModel.eliminatePlayer(session, {playerId: 'player2'})).toEqual({
        ...session,
        players: ['player1']
      })
    })
  })

})