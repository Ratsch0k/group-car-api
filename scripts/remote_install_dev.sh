#!/bin/bash
set -ev

cd $1

# Install dependencies
npm install

# Get secrets from environment file
source $2
export DB_USERNAME DB_HOSTNAME DB_PASSWORD DB_NAME

# Migrate database changes
npm run devMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart dev.my-group-car.de