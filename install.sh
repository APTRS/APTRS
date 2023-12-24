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


echo 'Installing Python Requirements'
rm db.sqlite3
python3 -m pip install -r ../requirements.txt
python3 APTRS/manage.py makemigrations
python3 APTRS/manage.py makemigrations accounts
python3 APTRS/manage.py makemigrations project
python3 APTRS/manage.py migrate
python3 manage.py migrate accounts 


echo "Setting up the Django Project"
python3 manage.py FirstSetup

