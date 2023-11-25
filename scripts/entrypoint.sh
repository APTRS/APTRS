#!/bin/bash
set -e 

python3 APTRS/manage.py makemigrations && \
python3 APTRS/manage.py migrate
cd APTRS && gunicorn -b 0.0.0.0:8000 "APTRS.wsgi:application" --workers=1 --threads=10 --timeout=3600
