#!/bin/bash
set -e


cd APTRS

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h $POSTGRES_HOST -U $POSTGRES_USER; do
  sleep 2
done
echo "PostgreSQL is ready!"

# Check if the database exists
echo "Checking if database $POSTGRES_DB exists..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw $POSTGRES_DB

if [ $? -eq 0 ]; then
  echo "Database $POSTGRES_DB exists."
else
  echo "Database $POSTGRES_DB does not exist. Exiting."
  exit 1
fi



# Make migrations  
echo "Creating migrations for all apps"
python3 manage.py makemigrations accounts
python3 manage.py makemigrations configapi
python3 manage.py makemigrations customers
python3 manage.py makemigrations project
python3 manage.py makemigrations vulnerability

# Apply migrations
echo "Applying migrations"
python3 manage.py migrate

echo "Migrations Completed"


exec gunicorn -b 0.0.0.0:8000 "APTRS.wsgi:application" --workers=3 --threads=3 --timeout=3600