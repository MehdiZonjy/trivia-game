import { Answer, Question} from '../../app/model/question'
import {createRepo} from '../../app/repositories/inmemory/questions-repo'
import * as Faker from 'faker'

const createAnswer = (): Answer => ({
  id: Faker.random.number(),
  text: Faker.random.uuid(),
  isCorrect: Faker.random.boolean()
})

const createQuestion = (): Question => ({
  id: Faker.random.uuid(),
  text: Faker.random.word(),
  answers: [createAnswer()]
})


describe('questions-repo', ()=>{
  it('saveQuestion should return true',async ()=>{
    const question = createQuestion()
    const repo  = createRepo()
    return expect(repo.saveQuestion(question)).resolves.toBeTruthy()
  })

  it('getQuestion should  return a question that already exists', async ()=>{
    const question = createQuestion()
    const repo = createRepo()
    await repo.saveQuestion(question)
    return expect(repo.getQuestion(question.id)).resolves.toEqual({...question})
  })

  it('getQuestionsCount should return questions count', async ()=>{
    const repo = createRepo()
    await Promise.all([repo.saveQuestion(createQuestion()),
    repo.saveQuestion(createQuestion())])

    return expect(repo.getQuestionsCount()).resolves.toEqual(2)
  })

  it('getRandomQuestions', async ()=> {
    const repo = createRepo()
    const q1 = createQuestion()
    const q2 = createQuestion()
    const q3 = createQuestion()
    await Promise.all([
      repo.saveQuestion(q1),
      repo.saveQuestion(q2),
      repo.saveQuestion(q3),
    ])
    const questions = await repo.getRandomQuestions(2)
    expect(questions).toHaveLength(2)
  })
})