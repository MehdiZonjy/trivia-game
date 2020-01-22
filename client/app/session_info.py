from enum import Enum

class SessionInfo:
  def __init__(self, sessionId, playerToken, playerId):
    self.sessionId = sessionId
    self.playerToken = playerToken
    self.playerId = playerId



class PlayerState(Enum):
  Qualified = "Qualified"
  Disqualified = "Disqualified"
  NotPartOfSession = "NotPartOfSession"
  GameOver = "OutGameOver"