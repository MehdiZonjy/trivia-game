import {Session,SessionState} from '../../app/model/session'
import {createSessionsRepo} from '../../app/repositories/inmemory/sessions-repo'
import * as Faker from 'faker'

const createSession = (): Session=>({
  id: Faker.random.uuid(),
  state: SessionState.pendingPlayersToJoin,
  players: [],
  questions: []
})

describe('sessions-repo', ()=>{
  it('should return true when adding a session', async ()=>{
    const session: Session = createSession()
    const repo = createSessionsRepo()
    expect(repo.saveSession(session)).resolves.toEqual(true)

  })
  it('should be able to retrieve a previously added session ', async ()=>{
    const session = createSession()
    const repo = createSessionsRepo()
    await repo.saveSession(session)
    const session2= await repo.getSession(session.id)
    expect(session2).toEqual({
      ...session
    })
  })
})