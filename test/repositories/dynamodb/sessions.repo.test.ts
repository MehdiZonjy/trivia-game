import {createRepo} from '../../../app/repositories/dynamodb/sessions-repo'
import {dynamodbClient, dynamodbDocumentClient, createSessionsTable , deleteTable} from './utils'
import * as TestUtils from '../../test-util'
const client = dynamodbClient()
const documentClient = dynamodbDocumentClient()

describe('dynamodb-sessions-repo', ()=>{
  const repo = createRepo(documentClient)

  beforeEach (async () => {
    await deleteTable(client, 'sessions')
    await createSessionsTable(client) 
  })
  it('should be able to add and retreive sessions',async ()=>{
    const session = TestUtils.createNewSession({})
    await repo.saveSession(session)
    const session2 = await repo.getSession(session.id)
    expect(session).toEqual(session2)
  })

  it('getActiveSessions# should be able to return sessions New or inProgress sessions', async ()=>{
    await Promise.all([
      repo.saveSession(TestUtils.createNewSession({})),
      repo.saveSession(TestUtils.createInProgressSession({})),
      repo.saveSession(TestUtils.createFinishedSession({}))
    ])

    return expect(repo.getActiveSessions()).resolves.toHaveLength(2)
  })
})