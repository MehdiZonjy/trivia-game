import {createRepo} from '../../../app/repositories/dynamodb/responses-repo'
import {dynamodbClient, dynamodbDocumentClient, createSessionResponses , deleteTable} from './utils'
import * as TestUtils from '../../test-util'
const client = dynamodbClient()
const documentClient = dynamodbDocumentClient()

describe('dynamodb-responses-repo', ()=>{
  const repo = createRepo(documentClient)

  beforeEach (async () => {
    await deleteTable(client, 'responses')
    await createSessionResponses(client) 
  })
  it('saveResponse# should be able to save responses',async ()=>{
    const response = TestUtils.createResponse({})
    return expect(repo.saveResponse(response)).resolves.toBeTruthy()
  })

  it('getSessionRoundResponses# should be able to return responses by session and round', async ()=>{
    const round = 1
    const sessionId = 'session1'
    const session1Res1 = TestUtils.createResponse({
      sessionId,
      round
    })
    
    const session1Res2 = TestUtils.createResponse({
      sessionId,
      round
    })


    await Promise.all([
      repo.saveResponse(session1Res1),
      repo.saveResponse(session1Res2),
      repo.saveResponse(TestUtils.createResponse({}))
    ])

    return expect(repo.getSessionRoundResponses(sessionId, round)).resolves.toHaveLength(2)
  })
})