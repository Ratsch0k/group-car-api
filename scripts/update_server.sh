#!/bin/bash

docker-compose -f docker-compose.yml -f config.yml up -d --build --no-deps $1