import Ajv from 'ajv'
const Schema = {
  "type": "object",
  "properties": {
    "round": { "type": "number"},
    "answerId": { "type": "string" },
    "questionId": {"type": "string"}
  },
  "required": ["round", "answerId", "questionId"],
  "additionalProperties": false
}


const ajv = Ajv()
const validator = ajv.compile(Schema)
interface SubmitAnswerRequest {
  answerId: string
  round: number
  questionId: string
}

export const validate = (obj: any): obj is SubmitAnswerRequest => {
  const valid = validator(obj)
  if(!valid) {
    // log errors
  }
  return valid as boolean
}  