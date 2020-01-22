# Trivia Game Implementation
a humble implementation of Trivia game in `Node.js` and `Python`


## Roles
- Two players to start a session.
- 10 seconds per round
- In the sample questions i'm using `Answer 1` is always correct 
## Try The Game Online
The game is already deployed at [https://trivia.mzmuse.com](https://trivia.mzmuse.com). You can run the python clients using docker and get started:
```
docker run -it --net host --rm mehdizonjy/trivia-client "https://trivia.mzmuse.com" 
```

## Run Locally
Make sure you have docker and docker-compose setup
```bash
# start game backend
./run-app.sh
# start client
./run-client.sh 
# when asked for game endpoints use http://localhost:4000
```


## Domain Model
I'm using ADT (algebraic data types) to model my domain. There are 3 types:

- [Session](app/model/session.ts): represents a game session. Each session can be either "New", "InProgress" or "Finished"
- [Question](app/model/question.ts): Questions and their accompanying response.
- [Response](app/model/response.ts): Responses gathered from players during for a particular round and session.


## Architecture

### Approach 1
 
My goal in this approach is to create a stateless application that can be scaled horizontally.

I tried to avoid websockets or any long living connection in my design as they complicate things on the infra and deployment level.
- To efficiently use websockets, I'll need an application load balancer; level 7 load balancer.
- Deployment becomes tricky. In order to shutdown an instance, it's necessary to drain all active connections before replacing it.
- Connection drop needs to be handled on clients side.


Due to all the above reasons I chose to implement the game using:
- REST service written in `Node.js`
- [GameController](app/game-controller.ts) that continuously attempts to update state of (InProgress | New) sessions
- Cli client written in `Python` that uses polling mechanism to get updates.
- Dynamodb for storage (locally hosted `Dynamodb` as I don't have access to aws :( )


#### Production Setup
- Nodejs application running in container
- Dynamodb implementation sharing same docker compose stack as nodejs app
- Nginx running on host as reverse proxy
- cloudflare to manage my dns
- my VPS is running in DigitalOcean where I manage everything with `Ansible` and `Terraform`
- Cli client built in Python


The app service exposes a couple of endpoints:
### POST /sessions
Creates a new session

Response:
```json
{
  "playerId":"string",
  "sessionId": "string",
  "playerToken": "string"
}
```
### POST /sessions/<sessionId>/join
Allows a player to join an existing session

Response:
```json
{
  "playerId": "string",
  "sessionId": "string"
   "playerToken": "string"
}

### POST /sessions/submitAnswer
Submit answer. Requires authentication using `playerToken`
```json
Header: {
  "Authorization": "Bearer <playerToken>"
}
```


### GET /sessions/<sessionId>
Get session state

*Note* Use the `state` field to distinguish what session schema you should parse
Response:
```json
// in case of new session
{
  "sessionId": "string",
  "playersCount": "number",
  "state": "newSession"
}

// in case of inProgress session
{
  "sessionId": "string",
  "question": {
     "id":"string",
     "text": "string",
     "Answers": [
       {  
         "id": "string",
         "text": "string
       }
     ] 

  },
  "round": number,
  "remainingPlayers": number,,
  "state": "inProgress"
}

// incase session is over
{
  "sessionId":"string",
  "winner": "string",
  "totalRounds": "number",
  "state": "over" 
}
```

### GET /sessions/<sessionId>/rounds/<roundNumber>
Retrieves players response for the request round
```json
{
  "text": "string",
   "responses": [
      {
        "text": "string",
        "playersCount": "number"
      }
    ]
}
```
### GET /me
Validates token and the player’s state in session
Response
```json
"Qualified" | "Disqualified" | "NotPartOfSession"
```



### Approach 2
This problem seems perfect for the actor model.

- Each actor would present a game session, and all players interactions become messages that are delivered to their corresponding actor.
- Akka actors run in a single thread, thus limiting the chance of concurrency issues.
- Each aktor is responsible for managing its own state (New -> InProgress -> GameOver)
- Actors are deployed in a distributed environment, if we were to lose a node in the cluster, only sessions running on the host will be lost.
- It's possible to persist the actor state, by saving all the messages it has received. So when it recovers, we will playback all the previously received messages and end up with the same state (think EventSourcing)

I didn't get around to implement this, as I needed time to spike more on running Akka in distributed setup









## Improvements
- My Dynamodb implementation is not optimal. There are cases where i have to do a full scan of a table. This won’t scale in production. Ideally I’d create Global/Secondary Indexes
- More tests could be added
- There can only be a single [GameController](app/game-controller.ts). When scaling horizontally, it should be moved to its own deployment. It may also become a single point of failure in the system
- This implementation is prone to many race conditions.



