#!/bin/bash
set -ev

echo "Login to docker"
docker login https://docker.pkg.github.com -u Ratsch0k -p $(cat $2)

echo "Update server"
sudo /usr/local/bin/docker-compose -f /tmp/docker-compose.yml -f /tmp/config.yml up -d --build --no-deps $1