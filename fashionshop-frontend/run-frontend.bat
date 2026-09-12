@echo off
chcp 65001 >nul
title FashionShop - Frontend (Port 3000)
cd /d "%~dp0"

echo ===================================================
echo   FASHIONSHOP FRONTEND - NEXT.JS (PORT 3000)
echo ===================================================
echo.

call npm run dev
pause
