import * as uuid from 'uuid'


export type IdGenerator = () => string

export const idGenerator: IdGenerator = () => uuid.v4()