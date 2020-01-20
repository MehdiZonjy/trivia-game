import { Session } from '../../model/session'
import { SessionsRepo } from '../types'

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

  return {saveSession, getSession}

}