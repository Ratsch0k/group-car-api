#!/bin/bash
# set for debugging
# set -x

# crash if any error occurs
set -e

if [ $TRAVIS_BRANCH = "master" ]; then

    # encrypt key
    openssl aes-256-cbc -K $encrypted_c28e77baa059_key -iv $encrypted_c28e77baa059_iv -in deploy-key.enc -out deploy-key -d
    rm deploy-key.enc
    chmod 600 deploy-key
    mv deploy-key ~/.ssh/id_rsa

    # Create service file
    SERVICE_CONTENT=$"[Unit]\n"
    SERVICE_CONTENT=$"${SERVICE_CONTENT}Description=Api server for group-car. Handles api requests, not used as static resource distribution\n\n"
    SERVICE_CONTENT=$"${SERVICE_CONTENT}[Service]\n"
    SERVICE_CONTENT=$"${SERVICE_CONTENT}ExecStart=$SERVER_PATH/server.js\n"
    SERVICE_CONTENT=$"${SERVICE_CONTENT}User:$SERVER_USER\n"
    SERVICE_CONTENT=$"${SERVICE_CONTENT}Group:$SERVER_GROUP"

    touch server.service
    echo -e "$SERVICE_CONTENT" > server.service

    # Create new folder to use as repository, copy data and remove unnecessary files
    mkdir _rep
    cp -R *.* routes node_modules _rep
    cd _rep

    # Create new repository and push to server
    git init
    git remote add deploy "$SERVER_USER@$SERVER_IP:$SERVER_PATH"
    git config user.name = "Travis CI"

    git add .
    git commit -m "Deploy Commit: $TRAVIS_COMMIT"
    git push --force deploy master

else
    echo "Not on master branch, not deploying"
fi