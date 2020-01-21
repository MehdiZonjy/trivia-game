export interface Question {
  id: string
  text: string
  answers: Answer[]
}

export interface Answer {
  id: string
  text: string
  isCorrect: boolean
}



export const validateAnswer = (question: Question, answerId: string): boolean => {
  const answer = question.answers.find((ans) => ans.id === answerId)
  return answer != null && answer.isCorrect
}

