@echo off

FOR /F "tokens=2-4 delims=." %%A IN ('python --version 2^>^&1') DO (
    SET python_version=%%A.%%B.%%C
)
ECHO Installed Python version: %python_version%

REM Split the version string into major and minor versions
FOR /F "tokens=1-2 delims=." %%A IN ("%python_version%") DO (
    SET /A python_major_version=%%A
    SET /A python_minor_version=%%B
)

REM Check if the major version is 3
IF %python_major_version% NEQ 3 (
    echo Python version %python_version% is not in the 3.x series, which is not supported.
    exit /b
)

REM Check if the minor version is 8 or above
IF %python_minor_version% GEQ 8 (
    echo Python 3.8 and above found
) ELSE (
    echo Python version %python_version% is below 3.8, which is not supported.
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
  cd APTRS
  python -m venv ./venv
  set venv=.\venv\Scripts\python
  echo "%venv%"
  %venv% -m pip install --upgrade pip


  echo Installing Python Requirements
  %venv% -m pip install -r requirements.txt
  %venv% manage.py makemigrations
  %venv% manage.py migrate
  


  del db.sqlite3
  
  echo Setting up the Django Project
  %venv% manage.py FirstSetup

  exit /b 0
 || (
  echo APTRS require Python 3.8.
)
