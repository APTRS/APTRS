#!/bin/bash
set -e 


echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h $POSTGRES_HOST -U $POSTGRES_USER; do
  sleep 2
done
echo "PostgreSQL is ready!"


python3 APTRS/manage.py makemigrations
python3 APTRS/manage.py makemigrations accounts
python3 APTRS/manage.py makemigrations customes
python3 APTRS/manage.py makemigrations vulnerability
python3 APTRS/manage.py makemigrations project
python3 APTRS/manage.py makemigrations configapi

python3 APTRS/manage.py migrate

echo "Migations Completed"


cd APTRS
exec gunicorn -b 0.0.0.0:8000 "APTRS.wsgi:application" --workers=3 --threads=3 --timeout=3600
