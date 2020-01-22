import { SessionsService } from './services/sessions-service'
import { SessionsRepo } from './repositories/types'
import { Logger } from './utils/logger'
/**
 * advances old sessions
 */

interface GameController {
  start: () => void
  stop: () => void
}

interface GameControllerParams{
  sessionsService: SessionsService
  sessionsRepo: SessionsRepo
  logger: Logger
}

const CHECK_INTERVAL = 1000

export const createGameController = ({sessionsService: sessionService, sessionsRepo, logger}: GameControllerParams): GameController=>{
  
  let shouldStop = false
  const advanceSessions =async ()=> {
    if(shouldStop){
      return
    }
    
    const sessions = await sessionsRepo.getActiveSessions()
    logger.info(`Updating Sessions States: sessions(${sessions.length})`)
    await Promise.all(sessions.map(s => sessionService.moveToNextRound(s.id)))
    setTimeout(advanceSessions, CHECK_INTERVAL)
  }
  const start = () => {
    shouldStop = false
    setTimeout(advanceSessions, CHECK_INTERVAL)
  }

  const stop = () => shouldStop = true

  return {start, stop}
}