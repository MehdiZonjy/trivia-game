import Ajv from 'ajv'
import { Logger } from '../utils/logger'
const Schema = {
  "type": "object",
  "properties": {
    "round": { "type": "number" },
    "answerId": { "type": "string" },
    "questionId": { "type": "string" }
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

interface ValidationResult {
  result?: SubmitAnswerRequest
  error: string
}

type SubmitAnswerRequestValidator = (obj: any) => ValidationResult

export const createValidator = (logger: Logger): SubmitAnswerRequestValidator => (obj: any): ValidationResult => {
  const valid = validator(obj)
  const errors = JSON.stringify(validator.errors, null)

  if (!valid) {
    logger.info("Invalid Request", errors)
  }
  return {
    result: valid ? obj : undefined,
    error: errors
  }
}  