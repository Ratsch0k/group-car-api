#!/bin/bash
set -ev

# Set environment variables to use rootles docker instance
export PATH=/usr/bin:$PATH
export DOCKER_HOST=unix:///run/user/1001/docker.sock


echo "Login to docker"
cat $2 | docker login https://docker.pkg.github.com -u Ratsch0k --password-stdin

echo "Update server"
sudo /usr/local/bin/docker-compose -f /tmp/docker-compose.yml -f /tmp/config.yml up -d --build --no-deps $1