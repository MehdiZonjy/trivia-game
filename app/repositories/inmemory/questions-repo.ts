import { Question } from '../../model/question'
import { QuestionsRepo } from '../types'
import * as _ from 'lodash'


interface QuestionsStorage {
  [id: string]: Question
}



export const createRepo = (): QuestionsRepo => {
  const storage: QuestionsStorage = {}


  const getQuestionsCount = async (): Promise<number> => Object.keys(storage).length

  const saveQuestion = async (question: Question): Promise<boolean> => {
    storage[question.id] = question
    return true
  }

  const getQuestion = async (questionId: string): Promise<Question | undefined> => {
    return storage[questionId]
  }

  const getRandomQuestions = async (count: number): Promise<Question[]> => {
    return _.sampleSize(storage, count)
  }

  return {
    saveQuestion,
    getQuestion,
    getQuestionsCount,
    getRandomQuestions
  }
}
