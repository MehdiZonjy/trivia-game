#!/bin/bash


read -p "Enter Trivia Server endpoint [https://trivia.mzmuse.com]:" endpoint

endpoint=${endpoint:-https://trivia.mzmuse.com}

docker build -f client.Dockerfile . -t trivia-client
docker run -it --net host --rm trivia-client $endpoint