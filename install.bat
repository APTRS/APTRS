@echo off

FOR /F "tokens=* USEBACKQ" %%F IN (`python --version`) DO (
SET var=%%F
)
ECHO %var%
if "%var%" GEQ "Python 3.8" (
    echo Python 3.8 and above found
  ) else (
    echo "%var%"
    echo APTRS require Python 3.8+ .
    exit /b
  )




  pip >nul 2>&1 && (
    echo pip3 is installed
  ) || (
    echo python3-pip not installed
    pause
    exit /b
  )


  echo [INSTALL] Creating venv
  rmdir "venv" /q /s >nul 2>&1
  python -m venv ./venv
  set venv=.\venv\Scripts\python
  echo "%venv%"
  %venv% -m pip install --upgrade pip


  echo Installing Python Requirements
  %venv% -m pip install -r requirements.txt
  %venv% manage.py makemigrations
  %venv% manage.py migrate
  

  echo Download and Install wkhtmltopdf Version 0.12.6 for PDF Report Generation - https://wkhtmltopdf.org/downloads.html
  echo Installation Complete
  exit /b 0
) || (
  echo APTRS require Python 3.8.
)
