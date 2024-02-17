#!/bin/bash


generate_password() {
    openssl rand -base64 64 | tr -dc 'a-zA-Z0-9'
}


## Install requirements
sudo apt update
## Need Nginx and git
echo "Installing Git and Ngnix"
sudo apt install -y nginx git

## Require for random and SSL TLS
echo "Installing OpenSSL"
sudo apt install -y openssl

## Download Source Code from github
echo "Downloading Source code from github to /var/www/aptrs"
sudo git clone -b API https://github.com/APTRS/APTRS /var/www/aptrs

echo "Creating a new APTRS user"
if ! id "aptrs" &>/dev/null; then
    adduser --system --no-create-home aptrs
fi

sudo chown -R aptrs:aptrs /var/www/aptrs
sudo chmod -R 755 /var/www/aptrs



echo "Generating Random Secret key"
secret_key=$(generate_password)
echo "SECRET_KEY='$secret_key'" > /var/www/aptrs/APTRS/.env


## Setup New Account in APTRS
read -p "Please provide the username for new Admin account in APTRS (default: APTRS)" aptrs_username
read -p "Please provide the email for the new Admin account in APTRS (default: admin@aptrs.com): " email
read -p "Please provide the full name for the new Admin account in APTRS (default: Aptrs Admin): " full_name
read -p "Please provide the number for the new Admin account in APTRS (default: 916661234586): " number
read -p "Please provide the position for the new Admin account in APTRS (default: Security Engineer): " position
read -p "Please provide the password for the new Admin account in APTRS (default: iamweakpassword): " password
read -p "Please provide the name of your Organization (default: APTRS PVT): " org

aptrs_username=${aptrs_username:-APTRS}
email=${email:-admin@aptrs.com}
full_name=${full_name:-Aptrs Admin}
number=${number:-916661234586}
position=${position:-Security Engineer}
password=${password:-iamweakpassword}
org=${org:-APTRS PVT}

echo "USERNAME='$aptrs_username'" >> /var/www/aptrs/APTRS/.env
echo "EMAIL='$email'" >> /var/www/aptrs/APTRS/.env
echo "FullName='$full_name'" >> /var/www/aptrs/APTRS/.env
echo "Number='$number'" >> /var/www/aptrs/APTRS/.env
echo "Position='$position'" >> /var/www/aptrs/APTRS/.env
echo "PASSWORD='$password'" >> /var/www/aptrs/APTRS/.env
echo "ADMIN = True" >> /var/www/aptrs/APTRS/.env
echo "Group = 'Administrator'" >> /var/www/aptrs/APTRS/.env
echo "YOUR_COMPANY='$org'" >> /var/www/aptrs/APTRS/.env
echo "LOG_FILE_LOCATION = '/var/www/aptrs/aptrs.log'" >> /var/www/aptrs/APTRS/.env


read -p "Please provide the domain name or public ip address if any (default: 127.0.0.1, aptrs.local): " domain
domain=${domain:-127.0.0.1}
echo "WHITELIST_IP= [\"$domain\"]" >> /var/www/aptrs/APTRS/.env
echo "ALLOWED_HOST= [\"$domain\"]" >> /var/www/aptrs/APTRS/.env
echo "CORS_ORIGIN= [\"$domain\"]" >> /var/www/aptrs/APTRS/.env


read -p "Do you have Redis already installed? (Y/N): " redis_installed

if [[ $redis_installed == "N" || $redis_installed == "n" ]]; then
    # Install Redis server
    sudo apt install redis-server
    redis_password=$(generate_password)
    sudo sed -i "s/# requirepass foobared/requirepass $redis_password/" /etc/redis/redis.conf
    sudo systemctl restart redis-server
    echo "REDIS_URL='redis://localhost:6379/'" >> /var/www/aptrs/APTRS/.env
    echo "REDIS_PASSWORD='$redis_password'" >> /var/www/aptrs/APTRS/.env

elif [[ $redis_installed == "Y" || $redis_installed == "y" ]]; then
    read -p "Please provide the Redis IP address: " redis_ip
    read -p "Please provide the Redis port (default is 6379): " redis_port
    # Default port is 6379 if the user doesn't provide any
    redis_port=${redis_port:-6379}
    read -s -p "Please provide the Redis password (required): " redis_password
    echo "Redis configuration:"
    REDIS_URL="redis://$redis_ip:$redis_port/"
    echo "REDIS_URL='$REDIS_URL'" >> /var/www/aptrs/APTRS/.env
    echo "REDIS_PASSWORD='$redis_password'" >> /var/www/aptrs/APTRS/.env
    
else
    echo "Invalid input. Please enter Y or N."
fi



read -p "Is PostgreSQL already installed? (Y/N): " postgres_installed

if [[ $postgres_installed == "Y" || $postgres_installed == "y" ]]; then
    # Ask for IP and port
    read -p "Please provide the PostgreSQL IP address (default: 127.0.0.1): " postgres_ip
    postgres_ip=${postgres_ip:-127.0.0.1}
    read -p "Please provide the PostgreSQL port (default: 5432): " postgres_port
    postgres_port=${postgres_port:-5432}

    echo "Installing Postgresql client"
    sudo apt install -y postgresql-client

    echo "Attempt to connect to PostgreSQL"
    if pg_isready -h "$postgres_ip" -p "$postgres_port"; then
        echo "Connected to PostgreSQL."
        echo "Create new user and database for APTRS, username=aptrs_user, DB=APTRS"
        new_user="aptrs_user"
        new_db="APTRS"
        new_password=$(generate_password)
        sudo -u postgres psql -c "CREATE USER $new_user WITH PASSWORD '$new_password';"
        sudo -u postgres psql -c "CREATE DATABASE $new_db OWNER $new_user;"
        echo "Created new user: $new_user"
        echo "Created new database: $new_db"
        echo "Password for new user: $new_password"
    else
        echo "Unable to connect to PostgreSQL. Assuming PostgreSQL is not installed."
        postgres_installed="N"
    fi
fi

if [[ $postgres_installed == "N" || $postgres_installed == "n" ]]; then
    # Install PostgreSQL
    echo "Installing Postgresql"
    sudo apt update
    sudo apt install postgresql postgresql-contrib

    # Create new user and database
    echo "Create new user and database for APTRS, username=aptrs_user, DB=APTRS"
    new_user="aptrs_user"
    new_db="APTRS"
    new_password=$(generate_password)
    sudo -u postgres psql -c "CREATE USER $new_user WITH PASSWORD '$new_password';"
    sudo -u postgres psql -c "CREATE DATABASE $new_db OWNER $new_user;"
    echo "Created new user: $new_user"
    echo "Created new database: $new_db"
    echo "Password for new user: $new_password"
fi



## Using Python 3.10
sudo apt install -y python3.10 python-is-python3 python3-pip


### Requirements for weayprint
sudo apt install -y python3-pip python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
















