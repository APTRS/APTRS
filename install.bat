@echo off

FOR /F "tokens=2-4 delims=." %%A IN ('python --version 2^>^&1') DO (
    SET python_version=%%A.%%B.%%C
)
ECHO Installed Python version: %python_version%

REM Split the version string into major, minor, and patch versions
FOR /F "tokens=1-3 delims=." %%A IN ("%python_version%") DO (
    SET python_major_version=%%A
    SET python_minor_version=%%B
    SET python_patch_version=%%C
)

REM Compare the major and minor versions
IF %python_major_version% GEQ 3 (
    IF %python_minor_version% GEQ 8 (
        echo Python 3.8 and above found
    ) ELSE (
        echo Python version %python_version% is below 3.8, which is not supported.
        exit /b
    )
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
