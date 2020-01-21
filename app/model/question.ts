export interface Question {
  id: string
  text: string
  answers: Answer[]
}

export interface Answer {
  id: number
  text: string
  isCorrect: boolean
}



const validateAnswer = (question: Question, answerId: number): boolean => {
  const answer = question.answers.find((ans) => ans.id === answerId)
  return answer != null && answer.isCorrect
}

