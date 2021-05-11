#!/bin/bash
set -ev


echo "Login to docker"
< $2 docker login https://docker.pkg.github.com -u Ratsch0k --password-stdin

echo "Update server"
{
  sudo /usr/bin/docker stop $3 &&
  sudo /usr/bin/docker rm $3 &&
  sudo /usr/local/bin/docker-compose -f /home/$1/docker-compose.yml -f /home/$1/config.yml up -d --build --no-deps $3
} || {
  sudo /usr/local/bin/docker-compose -f /home/$1/docker-compose.yml -f /home/$1/config.yml up -d --build --no-deps $3
}
