#!/bin/bash

cd $1

# Install dependencies
npm install

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart group-car