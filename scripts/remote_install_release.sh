#!/bin/bash
set -ev

cd $1

# Install dependencies
npm install

# Get secrets from environment file
source $2
export DB_USERNAME DB_HOSTNAME DB_PASSWORD DB_NAME

# Migrate database changes
npm run prodMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart my-group-car.de