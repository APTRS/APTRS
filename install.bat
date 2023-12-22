@echo off

FOR /F "tokens=2-4 delims=." %%A IN ('python --version 2^>^&1') DO (
    SET python_version=%%A.%%B.%%C
)
ECHO Installed Python version: %python_version%

REM Remove spaces in version string for comparison
SET python_version_no_spaces=%python_version: =%

REM Compare the major and minor version numbers
IF "%python_version_no_spaces%" GEQ "3.8" (
    IF "%python_version_no_spaces%" LSS "3.12" (
        echo Python 3.8 and above found, but below 3.12
    ) ELSE (
        echo Python version %python_version% is 3.12 or above, which is not supported.
        exit /b
    )
) ELSE (
    echo Python version %python_version% is below 3.8.
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
