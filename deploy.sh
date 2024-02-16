#!/bin/bash

install_requirements() {
## Install requirements
sudo apt update

## Using Python 3.10
sudo apt install -y python3.10 python-is-python3 python3-pip

## Redis
sudo apt install -y redis-server

### Requirements for weayprint
sudo apt install -y python3-pip python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0

## Require for random and SSL TLS
sudo apt install -y openssl

}




redis_password=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c50)

sudo sed -i "s/# requirepass foobared/requirepass $redis_password/" /etc/redis/redis.conf

sudo systemctl restart redis-server


