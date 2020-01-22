class InProgressSession:
  def __init__(self, sessionId, question, round, remainingPlayers):
    self.sessionId = sessionId
    self.round = round
    self.question = question
    self.remainingPlayers = remainingPlayers


class NewSession:
  def __init__(self,sessionId, playersCount):
    self.sessionId = sessionId
    self.playersCount = playersCount

class FinishedSession:
  def __init__(self, sessionId, winner, totalRounds ):
    self.sessionId = sessionId
    self.winner = winner
    self.totalRounds = totalRounds
    
class Question:
  def __init__(self, id, text,answers):
    self.id = id
    self.text = text
    self.answers = answers

class Answer:
  def __init__(self, id, text):
    self.id = id
    self.text = text