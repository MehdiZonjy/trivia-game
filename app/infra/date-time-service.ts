export interface DateTimeService {
  now: () => Date
}


export const createSvc = (): DateTimeService => {
  const now = () => new Date()
  return { now }
}