

cd APTRS

celery -A APTRS worker -l debug &
celery -A APTRS beat -l debug &