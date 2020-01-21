export interface Logger {
  info: (message?: any, ...optionalParams: any[]) => void,
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
  debug: (message?: any, ...optionalParams: any[]) => void
}
export const createConsoleLogger = (): Logger => {
  return {
    debug: console.debug,
    error: console.error,
    info: console.info,
    warn: console.warn
  }
}

createConsoleLogger().info("asd")