export class ResourceNotFound {
  stack: string
  constructor(public message: string,public resourceId: string) {
    this.stack = new Error().stack || ''
  }
}


export class InvalidState {
  stack: string
  constructor(public message: string,public payload: object) {
    this.stack = new Error().stack || ''
  }
}