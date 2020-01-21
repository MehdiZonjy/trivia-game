export interface DateTimeService {
  now: () => Date
}


export const createDateTimeService = (): DateTimeService => {
  const now = () => new Date()
  return { now }
}