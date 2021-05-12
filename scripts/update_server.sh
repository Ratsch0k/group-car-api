#!/bin/bash
set -e


echo "Login to docker"
< $2 docker login https://docker.pkg.github.com -u Ratsch0k --password-stdin

echo "Pull newest image"
sudo /usr/bin/docker pull docker.pkg.github.com/ratsch0k/group-car-api/$3

echo "Update server"
{
  sudo /usr/bin/docker stop $3 &&
  sudo /usr/bin/docker rm $3 &&
  sudo /usr/local/bin/docker-compose -f /home/$1/docker-compose.yml -f /home/$1/config.yml up -d --build --no-deps $3
} || {
  sudo /usr/local/bin/docker-compose -f /home/$1/docker-compose.yml -f /home/$1/config.yml up -d --build --no-deps $3
}
