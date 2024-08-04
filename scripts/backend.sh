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

# Remove old migration files
echo "Removing old migration files..."
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc"  -delete
find . -name "*.pyc" -exec rm -f {} +



echo "Running flush"
python3 manage.py migrate --noinput 


echo "Running no input migrate"
python3 manage.py flush --no-input





# Run the initial migration to ensure database schema is in a clean state
echo "Running initial migration"
python3 manage.py migrate

# Make migrations for all apps
echo "Creating migrations for all apps"
python3 manage.py makemigrations

# Apply migrations
echo "Applying migrations"
python3 manage.py migrate

echo "Migrations Completed"


exec gunicorn -b 0.0.0.0:8000 "APTRS.wsgi:application" --workers=3 --threads=3 --timeout=3600