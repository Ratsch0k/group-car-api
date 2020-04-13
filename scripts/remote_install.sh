#!/bin/bash
set -ev

source ~/.bashrc

cd $1

# Install dependencies
npm install

# Migrate database changes
npm run prodMigrate

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart group-car