import requests
from session_info import SessionInfo, PlayerState, ResponseStats, RoundStats
from session_states import InProgressSession, FinishedSession, NewSession, Answer, Question


def startSessionUrl(endpoint):
  return f'{endpoint}/sessions'
def sessionStatusUrl(endpoint, sessionId):
  return f"{endpoint}/sessions/{sessionId}"
def joinSessionUrl(endpoint, sessionId):
  return f"{endpoint}/sessions/{sessionId}/join"
def submitResponseUrl(endpoint):
  return f"{endpoint}/sessions/submitAnswer"
def playerStateUrl(endpoint):
  return f'{endpoint}/me'
def roundStatsUrl(endpoint, sessionId, round):
  return f'{endpoint}/sessions/{sessionId}/rounds/{round}' 


class HttpClient:
  def __init__(self, endpoint):
    self.endpoint = endpoint

  def createSession(self):
    responseObj = requests.post(startSessionUrl(self.endpoint))
    if responseObj.status_code != 200:
      print(f"unexpected response: code({responseObj.status_code}), (msg: {responseObj.text})")
      return None
    response = responseObj.json()
    sessionId = response['sessionId']
    playerToken = response['playerToken']
    playerId = response['playerId']
    return SessionInfo(sessionId, playerToken, playerId)

  
  def getSessionState(self, sessionId):
    responseObj = requests.get(sessionStatusUrl(self.endpoint, sessionId))
    if responseObj.status_code != 200:
      print(f"invalid response: code({responseObj.status_code}), msg({responseObj.text})")
      return None
    response = responseObj.json()
    state = response['state']

    if state == 'newSession':
      return NewSession(response['sessionId'], response['playersCount'])
    elif state == 'inProgress':
      answers = []
      for ans in response['question']['answers']:
        answers.append(Answer(ans['id'], ans['text']))
      question = Question(response['question']['id'], response['question']['text'], answers)
      return InProgressSession(response['sessionId'], question, response['round'], response['remainingPlayers'])
    elif state == 'over':
      return FinishedSession(response['sessionId'], response.get('winner', None), response['totalRounds'])
    else:
      print("unknown session state", state)
      None

  def joinSession(self, sessionId):
    responseObj = requests.post(joinSessionUrl(self.endpoint, sessionId))
    if responseObj.status_code != 200:
      print(f"invalid response: code({responseObj.status_code}), msg({responseObj.text})")
      return None
    response = responseObj.json()
    sessionId = response['sessionId']
    playerToken = response['playerToken']
    playerId = response['playerId']
    return SessionInfo(sessionId, playerToken, playerId)

  def submitResponse(self, playerToken, round, questionId, answerId):
    responseObj = requests.post(submitResponseUrl(self.endpoint), json = {
      "questionId": questionId,
      "answerId":answerId,
      "round": round
    }, headers ={
      "Authorization": f"Bearer {playerToken}"
    } )

    if responseObj.status_code != 200:
      return False
    return True
  
  def playerState(self, playerToken):
    responseObj = requests.get(playerStateUrl(self.endpoint),
    headers = {
      "Authorization": f"Bearer {playerToken}"
    })
    if responseObj.status_code != 200:
      return PlayerState.GameOver
    
    if responseObj.text == 'Qualified':
      return PlayerState.Qualified
    elif responseObj.text == 'Disqualified':
      return PlayerState.Disqualified
    elif responseObj.text == 'NotPartOfSession':
      return PlayerState.NotPartOfSession
    else:
       PlayerState.GameOver
  def roundStats(self, sessionId, round):
    responseObj = requests.get(roundStatsUrl(self.endpoint, sessionId, round))
    if responseObj.status_code != 200:
      return None
    
    response = responseObj.json()
    playersResponses = []
    for x in response['responses']:
      playersResponses.append(ResponseStats(x['text'], x['playersCount']))

    return RoundStats(response['text'], playersResponses)