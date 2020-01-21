import { Session } from '../model/session'
import { Question } from '../model/question'
import { Response } from '../model/response'
export interface SessionsRepo {
  saveSession: (Session: Session) => Promise<boolean>
  getSession: (id: string) => Promise<Session | undefined>
}


export interface QuestionsRepo {
  saveQuestion: (question: Question) => Promise<boolean>
  getQuestion: (id: string) => Promise<Question | undefined>
  getQuestionsCount: () => Promise<number>
  getRandomQuestions: (count: number) => Promise<string[]>
}

export interface ResponsesRepo {
  saveResponse: (response: Response) => Promise<boolean>
  getSessionRoundResponses: (sessionId: string, round: number) => Promise<Response[]>
}

