#! /bin/bash

docker build -f app.Dockerfile . -t mehdizonjy/trivia
docker push mehdizonjy/trivia


