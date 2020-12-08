#!/bin/bash
set -e

# import ssh key
mkdir ~/.ssh
echo "$SSH_KEY" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519

echo "$SSH_KNOWN_HOST" > ~/.ssh/known_hosts