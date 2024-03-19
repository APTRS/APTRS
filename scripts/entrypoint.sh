#!/bin/bash
set -e 

python3 APTRS/manage.py makemigrations && \
python3 APTRS/manage.py migrate


if [ ! -f /tmp/initialized.txt ]; then
    # Perform delete and load data operations
    python3 APTRS/manage.py shell <<EOF
from django.contrib.contenttypes.models import ContentType
ContentType.objects.all().delete()
EOF

    python3 APTRS/manage.py loaddata APTRS/PGdata.json

    # Create a marker file to indicate database initialization
    touch /tmp/initialized.txt
fi

cd APTRS
exec gunicorn -b 0.0.0.0:8000 "APTRS.wsgi:application" --workers=3 --threads=3 --timeout=3600

