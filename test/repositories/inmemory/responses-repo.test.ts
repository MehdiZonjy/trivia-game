import {Response} from '../../../app/model/response'
import {createRepo} from '../../../app/repositories/inmemory/responses-repo'
import {createResponse} from '../../test-util'


describe('responses-repo', ()=>{
  describe('saveResponse', ()=>{
    it('returns true when it succeeds', ()=>{
      const repo = createRepo()
      const response = createResponse({})
      return expect(repo.saveResponse(response)).resolves.toBeTruthy()
    })
  })
  describe('getSessionRoundResponses', ()=>{
    it('returns all matching available responses', async ()=>{
      const repo = createRepo()
      const sessionId = 'session1'
      const round = 1

      const res1 = createResponse({
        sessionId,
        round
      })
      const res2 = createResponse({
        sessionId,
        round
      })
      const res3 = createResponse({
        sessionId,
        round: round - 1
      })
      
      await Promise.all([repo.saveResponse(res1), repo.saveResponse(res2), repo.saveResponse(res3)])

      return expect(repo.getSessionRoundResponses(sessionId, round))
      .resolves.toEqual([res1, res2])
    })
  })
})

