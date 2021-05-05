#!/bin/bash
set -e

chmod +x build/group-car.js

# Create test report
echo "Run tests to get test coverage"
yarn coverage

echo "Create coverage badge"
node scripts/create-coverage-badge.js -s beta -c statements -l 'https://dev.my-group-car.de/beta/coverage' -o 'static/test/coverage/badge'

# Create licenses disclaimer
echo "Generate licenses disclaimer"
yarn generate-disclaimer

# Get tag from reference
REF=$"${GITHUB_REF}"
version="${REF/refs\/tags\//}"

# Build and tag images
echo "Build image docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:$version"
docker build -t docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:$version .

echo "Build image docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:latest"
docker tag docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:$version docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:latest

# Login to docker registry
echo "Login to docker"
echo "$PASSWORD" | docker login https://docker.pkg.github.com -u Ratsch0k --password-stdin

# Push images
echo "Push images"
docker push docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:$version
docker push docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:latest

echo "Update remote container"
docker-compose -H "ssh://$SERVER_USER@$SERVER_IP" -f docker-compose.yml -f $COMPOSE_CONFIG up -d --build --no-deps $SERVER_NAME