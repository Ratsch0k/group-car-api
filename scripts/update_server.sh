#!/bin/bash
set -ed

docker-compose -f /tmp/docker-compose.yml -f /tmp/config.yml up -d --build --no-deps $1