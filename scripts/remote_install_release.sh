#!/bin/bash
set -ev

cd $1

# Install dependencies
npm install

# Change owner of node_modules to deploy. Necessary for deploy user to update server
sudo chown -R deploy node_modules

# Get secrets from environment file
source $2 >/dev/null
export DB_USERNAME DB_HOSTNAME DB_PASSWORD DB_NAME >/dev/null

# Migrate database changes
npm run prodMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart my-group-car.de