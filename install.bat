@echo off

FOR /F "tokens=* USEBACKQ" %%F IN (`python --version 2^>^&1`) DO (
    SET "var=%%F"
)

SET "var=%var:Python =%"

SET "major="
SET "minor="
SET "patch="

REM Split the version string by dots and set each part to a variable
FOR /F "tokens=1-3 delims=." %%A IN ("%var%") DO (
    SET "major=%%A"
    SET "minor=%%B"
    SET "patch=%%C"
)

REM Check if the first part is 3
IF "%major%" EQU "3" (
    ECHO Python 3.X found
) ELSE (
    ECHO Found version %var%, APTRS only support Python 3.8 and Above
    EXIT /B 1
)


IF %minor% GEQ 8 (
    ECHO Python 3.%minor% found.
) ELSE (
    ECHO Found version %var%, APTRS only support Python 3.8 and Above
    EXIT /B 1
)


  pip >nul 2>&1 && (
    echo pip3 is installed
  ) || (
    echo python3-pip not installed
    pause
    exit /b
  )


  echo [INSTALL] Creating venv
  cd APTRS
  rmdir "venv" /q /s >nul 2>&1
  python -m venv ./venv
  set venv=.\venv\Scripts\python
  echo "%venv%"
  %venv% -m pip install --upgrade pip

  del db.sqlite3
  echo Installing Python Requirements
  %venv% -m pip install -r ../requirements.txt
  %venv% manage.py makemigrations
  %venv% manage.py makemigrations accounts
  %venv% manage.py makemigrations project
  %venv% manage.py migrate
  %venv% manage.py migrate accounts 
  


  
  echo Setting up the Django Project
  %venv% manage.py FirstSetup

  exit /b 0
 || (
  echo APTRS require Python 3.8.
)
