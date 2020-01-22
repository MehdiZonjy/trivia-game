import requests
import sys
import time
from http_client import HttpClient
from session_states import InProgressSession, FinishedSession, NewSession
from session_info import PlayerState
from utils import readNumber

class SessionInfo:
  def __init__(self, sessionId, playerToken, playerId):
    self.sessionId = sessionId
    self.playerToken = playerToken
    self.playerId = playerId



def startNewSession(httpClient):
  session = httpClient.createSession()
  if not session:
    return None
  print(f"new session started: sessionId({session.sessionId}), playerId({session.playerId})") 
  return session

def waitForPlayers(sessionInfo, httpClient):
  print("Waiting for players to join")
  sessionStarted = False
  while not sessionStarted:
    sessionState = httpClient.getSessionState(sessionInfo.sessionId)
    
    if not sessionState:
      print("unable to get session state")
      return False
    
    if isinstance(sessionState, InProgressSession):
      return True
    elif isinstance(sessionState, NewSession):
      continue
    elif isinstance(sessionState, FinishedSession):
      print("This session is over")
      return False
    time.sleep(1)


def joinSession(httpClient, sessionId):
  print(f"Joining Session {sessionId}")
  session = httpClient.joinSession(sessionId)
  if session:
    print(f"joined sessoin: sessionId({session.sessionId}), playerId({session.playerId})")
  return session


def showPlayerStats(httpClient, sessionInfo):
  
def showEndScreen(httpClient,sessionInfo):
  # pass
  sessionState = httpClient.getSessionState(sessionInfo.sessionId)
  if not (sessionState and isinstance(sessionState, FinishedSession)):
    return
  winner = "You" if sessionState.winner == sessionInfo.playerId else sessionState.winner 
  print(f"""
--------------------------
Total Rounds: {sessionState.totalRounds}
Winner: {winner if winner else "None"}
--------------------------
  """)
  

def promptQuestionAndSendAnswer(sessionInfo, sessionState, httpClient):
  question =sessionState.question
  answersTxt =''
  for i in range(0, len(question.answers)):
    answersTxt += f"{i + 1}: {question.answers[i].text}\n"
  print(f"""
###########
Question: {question.text}
{answersTxt}
###########  
  """)
  answerIndex = readNumber("Select Answer:", 1, len(question.answers)) - 1
  answerId = question.answers[answerIndex].id
  return httpClient.submitResponse(sessionInfo.playerToken, sessionState.round, question.id, answerId)


def validateUserState(sessionInfo, httpClient):
  playerState = httpClient.playerState(sessionInfo.playerToken)
  return playerState == PlayerState.Qualified


def handleInProgressSession(sessionInfo, sessionState, httpClient):
    if not validateUserState(sessionInfo, httpClient):
      return False
    answerSubmitted = promptQuestionAndSendAnswer(sessionInfo, sessionState, httpClient) 
    if answerSubmitted:
      print("Answer Saved. Waiting for next round")
    return answerSubmitted

def startSession(sessionInfo, httpClient):
  gameOver = False
  prevRound = -1
  while not gameOver:
    sessionState = httpClient.getSessionState(sessionInfo.sessionId)
    if not sessionState:
      print("Faild to get session state")
      return
    
    if isinstance(sessionState, InProgressSession): # game is in progress
      if prevRound != sessionState.round: # only display a new question when sessoin advanced to next round
        prevRound = sessionState.round
        shouldProcceed = handleInProgressSession(sessionInfo, sessionState, httpClient)
        if not shouldProcceed:
          showEndScreen(httpClient, sessionInfo)
          return
      time.sleep(1)
    elif isinstance(sessionState, NewSession): 
      print('how did i get here')
      return
    elif isinstance(sessionState, FinishedSession):
      print("Game over")
      return showEndScreen(httpClient, sessionInfo)
      return



def getEndpoint():
  if len(sys.argv) >= 2:
    return sys.argv[1]
  return 'http://localhost:8080'


def main():
  endpoint = getEndpoint()
  httpClient = HttpClient(endpoint)
  while(True):
    print("""
  1: Start New Session
  2: Join Session
    """) 
    cmd = input()
    if cmd == "1":
      sessionInfo = startNewSession(httpClient)
      sessionInfo and waitForPlayers(sessionInfo, httpClient) and startSession(sessionInfo, httpClient)
    elif cmd == "2":
      print("Enter SessionId")
      sessionId = input()
      sessionInfo = joinSession(httpClient, sessionId)
      sessionInfo and waitForPlayers(sessionInfo, httpClient) and startSession(sessionInfo, httpClient)
    else:
      print("invalid input")



if __name__ == "__main__":
    main()