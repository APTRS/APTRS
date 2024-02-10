#!/bin/bash

command -v python3 > /dev/null 2>&1 || { echo >&2 "Python3 is not installed yet"; exit 1; }

python_version="$(python3 --version 2>&1 | awk '{print $2}')"
py_major=$(echo "$python_version" | cut -d'.' -f1)
py_minor=$(echo "$python_version" | cut -d'.' -f2)
if [ "$py_major" -eq "3" ] && [ "$py_minor" -gt "7" ]; then
    echo "Python ${python_version} is installed"
else
    echo "APTRS require Python 3.8 and above"
    exit 1
fi

python3 -m pip -V
if [ $? -eq 0 ]; then
    echo 'pip3 is installed'
else
    echo 'python3-pip not installed'
    exit 1
fi


echo 'Creating Python virtualenv'
cd APTRS
rm -rf ./venv
python3 -m venv ./venv
if [ $? -eq 0 ]; then
    echo 'Activating virtualenv'
    source venv/bin/activate
    pip install --upgrade pip
else
    echo 'Unable to create Virtualenv.'
    exit 1
fi

rm -f db.sqlite3
if [ $? -eq 0 ]; then
    echo "File db.sqlite3 deleted successfully."
else
    echo "Failed to delete db.sqlite3 file."
fi

echo 'Installing Python Requirements'

python3 -m pip install -r ../requirements.txt

echo 'Creating a New Secret Key'

NEW_SECRET_KEY=$(python3 -c "import random, string; print(''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=50)))")
sed -i "s/^SECRET_KEY=.*/SECRET_KEY='$NEW_SECRET_KEY'/" .env

echo 'Migrating Database'
python3 manage.py makemigrations
python3 manage.py makemigrations accounts
python3 manage.py makemigrations project
python3 manage.py migrate
python3 manage.py migrate accounts 


echo "Setting up the Django Project"
python3 manage.py first_setup

