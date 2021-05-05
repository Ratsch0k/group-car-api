#!/bin/bash
set -ev

echo "$1"
echo "$2"

PASSWORD=$(<$2)

echo "Login to docker"
docker login https://docker.pkg.github.com -u Ratsch0k -p $PASSWORD

echo "Update server"
sudo /usr/local/bin/docker-compose -f /tmp/docker-compose.yml -f /tmp/config.yml up -d --build --no-deps $1