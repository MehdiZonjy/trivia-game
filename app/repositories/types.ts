import {Session} from '../model/session'
import { Question } from '../model/question';
export interface SessionsRepo {
  saveSession: (Session: Session) => Promise<boolean>
  getSession: (id: string) => Promise<Session| undefined>
}


export interface QuestionsRepo {
  saveQuestion: (question: Question) => Promise<boolean>
  getQuestion: (id: string) => Promise<Question | undefined>
  getQuestionsCount: () => Promise<number>
  getRandomQuestions:(count: number) => Promise<Question[]>
}