import {createRepo} from '../../../app/repositories/dynamodb/questions-repo'
import {dynamodbClient, dynamodbDocumentClient, createQuestionsTable , deleteTable} from './utils'
import * as TestUtils from '../../test-util'
const client = dynamodbClient()
const documentClient = dynamodbDocumentClient()

describe('dynamodb-questions-repo', ()=>{
  const repo = createRepo(documentClient)

  beforeEach (async () => {
    await deleteTable(client, 'questions')
    await createQuestionsTable(client) 
  })
  it('should be able to add and retreive questions',async ()=>{
    const question = TestUtils.createQuestion({})
    await repo.saveQuestion(question)
    const question2 = await repo.getQuestion(question.id)
    expect(question).toEqual(question2)
  })

  it('should be able to return total questions count', async ()=>{
    await Promise.all([
      repo.saveQuestion(TestUtils.createQuestion({})),
      repo.saveQuestion(TestUtils.createQuestion({}))
    ])

    return expect(repo.getQuestionsCount()).resolves.toEqual(2)
  })

  it('getRandomQuestions# should be able to return subset of questions', async ()=>{
    await Promise.all([
      repo.saveQuestion(TestUtils.createQuestion({})),
      repo.saveQuestion(TestUtils.createQuestion({})),
      repo.saveQuestion(TestUtils.createQuestion({}))
    ])
    return expect(repo.getRandomQuestions(2)).resolves.toHaveLength(2)

  })
})