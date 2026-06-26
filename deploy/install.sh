INSTALL_DIR=/opt/enshrouded-discord
CONFIG_DIR=/etc/enshrouded-discord
USERNAME=enshrouded-discord
NODE_SOURCE=https://deb.nodesource.com/setup_26.x
NODE_VERSION=26.3.1-1nodesource1

# install node
curl --fail --silent --show-error --location "$NODE_SOURCE" | bash -
apt-get --yes install nodejs=$NODE_VERSION

# create user
id -u $USERNAME &>/dev/null
user_exists=$?
if [ $user_exists -ne 0 ]; then
	useradd --create-home --shell /bin/bash $USERNAME
fi

# install app
mkdir --parents $CONFIG_DIR
touch $CONFIG_DIR/.env
chown -R $USERNAME $CONFIG_DIR

mkdir --parents $INSTALL_DIR
npm install enshrouded-discordhow
chown -R $USERNAME .

# install service
cp ./enshrouded-discord.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now 'enshrouded-discord.service'
