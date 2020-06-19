#!/bin/bash
# crash if any error occurs
set -ev
 
# Build code
yarn tsc
 
# encrypt key
openssl aes-256-cbc -K $encrypted_c28e77baa059_key -iv $encrypted_c28e77baa059_iv -in deploy-key.enc -out deploy-key -d
rm deploy-key.enc
chmod 600 deploy-key
mv deploy-key ~/.ssh/id_rsa
 
# Create service file
SERVICE_CONTENT=$"[Unit]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Description=Beta api server for group-car. Handles api requests and serves frontend. For not completely released features.\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}After=network.target\n\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}[Service]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}ExecStart=/usr/bin/node -r tsconfig-paths/register $SERVER_PATH_BETA/build/group-car.js\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}WorkingDirectory=$SERVER_PATH_BETA\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=PATH=/usr/bin:/usr/local/bin\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=DEBUG=group-car:*\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=HTML_STATIC=../html/\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=PORT=8081\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=NODE_ENV=production\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Environment=SERVER_TYPE=beta\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}EnvironmentFile=$SERVER_ENV_FILE_PATH_BETA\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}Restart=always\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}User=$SERVER_SERVICE_USER_BETA\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}[Install]\n"
SERVICE_CONTENT=$"${SERVICE_CONTENT}WantedBy=multi-user.target"
 
touch beta.my-group-car.de.service
echo -e "$SERVICE_CONTENT" > beta.my-group-car.de.service
 
# Create new folder to use as repository, copy data and remove unnecessary files
chmod +x scripts/remote_install_beta.sh
chmod +x build/group-car.js

# Create test report
yarn coverage

node scripts/create-coverage-badge.js -s beta -c statements -l 'https://dev.my-group-car.de/beta/coverage' -o 'static/test/coverage/badge'

# Delete intermediate directory for report creation
rm -r mochawesome-report
 
# Delete node_modules for faster file transfer
rm -r node_modules
 
# Copy files to server to the correct path
rsync --recursive --times --compress --delete --quiet ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH_BETA

 
# Execute remote install script on server
ssh $SERVER_USER@$SERVER_IP sudo /bin/su - group-car-beta -s /bin/bash $SERVER_PATH_BETA/scripts/remote_install_beta.sh $SERVER_PATH_BETA $SERVER_ENV_FILE_PATH_BETA
