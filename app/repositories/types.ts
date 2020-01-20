import {Session} from '../model/session'
export interface SessionsRepo {
  saveSession: (Session: Session) => Promise<boolean>
  getSession: (id: string) => Promise<Session| undefined>
}


export interface SessionsRepo {
  saveSession: (Session: Session) => Promise<boolean>
  getSession: (id: string) => Promise<Session| undefined>
}