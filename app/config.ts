interface Config {
  jwtSecret: string

}

export const getConfig = (): Config => ({
  jwtSecret: process.env['JWT_SECRET'] || 'hello-worldz'
})