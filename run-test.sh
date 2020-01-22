#!/bin/bash

docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml run --rm tests
docker-compose -f docker-compose.test.yml down