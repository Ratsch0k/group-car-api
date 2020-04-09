#!/bin/bash
# crash if any error occurs
set -ev

# Build code
npm run tsc

# encrypt key
openssl aes-256-cbc -K $encrypted_c28e77baa059_key -iv $encrypted_c28e77baa059_iv -in deploy-key.enc -out deploy-key -d
rm deploy-key.enc
chmod 600 deploy-key
mv deploy-key ~/.ssh/id_rsa

# Create service file
SERVICE_CONTENT=$"[Unit]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Description=Api server for group-car. Handles api requests and serves frontend\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}After=network.target\n\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}[Service]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}ExecStart=$SERVER_PATH/start.sh\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}WorkingDirectory=$SERVER_PATH/build\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=PATH=/usr/bin:/usr/local/bin\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=DEBUG=group-api:*\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Restart=always\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}User=$SERVER_USER\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Group=$SERVER_GROUP\n\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}[Install]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}WantedBy=multi-user.target"

touch server.service
echo -e "$SERVICE_CONTENT" > server.service

# Create new folder to use as repository, copy data and remove unnecessary files
chmod +x _scripts/remote_install.sh
chmod +x build/server.js

# Copy files to server to the correct path
scp -r . $SERVER_IP:$SERVER_PATH

# Execute remote install script on server
ssh $SERVER_USER@$SERVER_IP $SERVER_PATH/_scripts/remote_install.sh $SERVER_PATH