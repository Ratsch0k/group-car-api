#!/bin/bash
set -e

chmod +x build/group-car.js
chmod +x scripts/update_server.sh

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

if [[ "$version" != *alpha* && "$version" != *beta* ]];
then
  # Only push an image with the version tag if it's a release version, otherwise just update latest image
  docker push docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:$version
fi
docker push docker.pkg.github.com/ratsch0k/group-car-api/$SERVER_NAME:latest


envsubst < $COMPOSE_CONFIG > config.yml
cat config.yml

echo "Upload compose configs"
rsync --compress --quiet docker/docker-compose.yml $SERVER_USER@$SERVER_IP:/home/$SERVER_USER/docker-compose.yml
rsync --compress --quiet config.yml $SERVER_USER@$SERVER_IP:/home/$SERVER_USER/config.yml
rsync --compress --quiet ./scripts/update_server.sh $SERVER_USER@$SERVER_IP:/home/$SERVER_USER/update_server.sh

echo "Update remote container"
ssh $SERVER_USER@$SERVER_IP sudo /home/$SERVER_USER/update_server.sh $SERVER_USER $ACCESS_PATH $SERVER_NAME