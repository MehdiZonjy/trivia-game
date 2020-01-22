import { Session, SessionState } from '../../model/session'
import { SessionsRepo } from '../types'
import * as _ from 'lodash'

interface SessionStorage {
  [id: string]: Session
}


export const createSessionsRepo = (): SessionsRepo => {
  const storage: SessionStorage = {}

  const saveSession = async (session: Session): Promise<boolean> => {
    storage[session.id] = session
    return true
  }

  const getSession = async (id: string): Promise<Session | undefined> => {
    return storage[id];
  }

  const getActiveSessions = async (): Promise<Session[]> => {
    const sessions = _.reduce(storage, (acc, session, key) =>{
      if(session.state === SessionState.inProgress || session.state === SessionState.newSession) {
        return [...acc, session]
      }
      return acc
    }, [] as Session[])
    return sessions
  }

  return {saveSession, getSession, getActiveSessions}

}