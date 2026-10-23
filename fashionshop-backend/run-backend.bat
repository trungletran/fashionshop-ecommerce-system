@echo off
chcp 65001 >nul
title FashionShop - Backend (Port 8080)
cd /d "%~dp0"

if exist "C:\Program Files\Java\jdk-21" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    set "PATH=C:\Program Files\Java\jdk-21\bin;%PATH%"
)

:: Avoid silently using an already-running (possibly outdated) backend.
netstat -ano | findstr /r /c:":8080 .*LISTENING" >nul
if not errorlevel 1 (
    echo [ERROR] Port 8080 is already in use. Stop the old backend process, then run this script again.
    echo          This launcher will not terminate another process automatically.
    pause
    exit /b 1
)

echo ===================================================
echo   FASHIONSHOP BACKEND - SPRING BOOT (PORT 8080)
echo ===================================================
echo.

call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-backend.ps1"
if errorlevel 1 (
    echo [ERROR] Backend failed to start. Review the Maven output above.
)
pause
