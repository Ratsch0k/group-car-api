#!/bin/bash
set -ev

cd $1

# Install dependencies
npm install

# Migrate database changes
npm run betaMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart beta.my-group-car.de