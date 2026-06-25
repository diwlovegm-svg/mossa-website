@echo off
setlocal

cd /d "%~dp0"
set "PORT=4175"
set "APP_URL=http://127.0.0.1:%PORT%/srirayong/"
set "PYTHON_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if not exist "%PYTHON_EXE%" (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python was not found.
    echo Open this folder in Codex and ask it to run the web app, or install Python.
    pause
    exit /b 1
  )
  set "PYTHON_EXE=python"
)

echo Opening MOSSA Coupon Web App...
echo %APP_URL%
echo.
echo Keep this window open while using the web app.
start "" "%APP_URL%"
"%PYTHON_EXE%" -m http.server %PORT% --bind 127.0.0.1
