import {Session,SessionState} from '../../app/model/session'
import {createSessionsRepo} from '../../app/repositories/inmemory/sessions-repo'
import {createNewSession} from '../test-util'


describe('sessions-repo', ()=>{
  it('should return true when adding a session', async ()=>{
    const session: Session = createNewSession({})
    const repo = createSessionsRepo()
    expect(repo.saveSession(session)).resolves.toEqual(true)

  })
  it('should be able to retrieve a previously added session ', async ()=>{
    const session = createNewSession({})
    const repo = createSessionsRepo()
    await repo.saveSession(session)
    const session2= await repo.getSession(session.id)
    expect(session2).toEqual({
      ...session
    })
  })
})