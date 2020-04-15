#!/bin/bash
set -ev

cd $1

# Install dependencies
npm install

# Migrate database changes
npm run devMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart group-car