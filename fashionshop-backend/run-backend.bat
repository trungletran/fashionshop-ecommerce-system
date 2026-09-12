@echo off
chcp 65001 >nul
title FashionShop - Backend (Port 8080)
cd /d "%~dp0"

if exist "C:\Program Files\Java\jdk-21" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    set "PATH=C:\Program Files\Java\jdk-21\bin;%PATH%"
)

echo ===================================================
echo   FASHIONSHOP BACKEND - SPRING BOOT (PORT 8080)
echo ===================================================
echo.

call mvnw.cmd spring-boot:run
pause
