#! /bin/bash

docker build -f client.Dockerfile . -t mehdizonjy/trivia-client
docker push mehdizonjy/trivia-client