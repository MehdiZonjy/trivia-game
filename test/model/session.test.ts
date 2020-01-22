import { SessionState, Session } from '../../app/model/session'
import * as SessionModel from '../../app/model/session'
import * as Faker from 'faker'
import { createInProgressSession, createNewSession } from '../test-util'

describe('session model', () => {
  describe('createSession', () => {
    it('should create new session', () => {
      const id = 'session1'
      const questions = ['question1', 'question2']

      expect(SessionModel.createSession({ id, questions })).toEqual({
        id,
        state: SessionState.newSession,
        questions,
        players: []
      })
    })
  })

  describe('startSession', () => {
    it('should start a session', () => {
      const session = createNewSession({})
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

  })

  describe('moveToNextRound', () => {
    it('shuold move to next round', () => {

      const currentRound = 3
      const session = createInProgressSession({ questions: [], currentRound })
      const now = new Date()
      expect(SessionModel.moveToNextRound(session, { date: now }))
        .toEqual({
          ...session,
          roundStartedAt: now,
          currentRound: currentRound + 1
        })
    })
  })

  describe('shouldMoveToNextRound', () => {
    it('should return true when roundStartedAt is past ROUND_DURATION', () => {

      const session = createInProgressSession({ roundStartedAt: Faker.date.past() })
      expect(SessionModel.shouldMoveToNextRound(session)).toBeTruthy()
    })
    it('should return false when roundStartedAt is less than ROUND_DURATION', () => {
      const session = createInProgressSession({ roundStartedAt: new Date() })
      expect(SessionModel.shouldMoveToNextRound(session)).toBeFalsy()
    })
  })
  describe('addPlayer', () => {
    it('should add player if in PendingPlayersToJoin state', () => {
      const session = createNewSession({ players: [] })
      expect(SessionModel.addPlayer(session, { playerId: 'player1' })).toEqual({
        ...session,
        players: [{ playerId: 'player1', disqualified: false }]
      })
    })
  })

  describe('eliminatePlayer', () => {
    it('should eliminate player from inProgress session', () => {
      const session = createInProgressSession({ qualifiedPlayers: ['player1', 'player2'] })
      expect(SessionModel.eliminatePlayer(session, { playerId: 'player2' })).toEqual({
        ...session,
        players: [
          { playerId: 'player1', disqualified: false },
          { playerId: 'player2', disqualified: true }]
      })
    })
  })

})