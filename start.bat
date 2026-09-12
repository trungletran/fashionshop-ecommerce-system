@echo off
chcp 65001 >nul
title FashionShop - E-Commerce Launcher
cls

echo =====================================================================
echo           FASHIONSHOP E-COMMERCE SYSTEM - ONE-CLICK LAUNCHER
echo =====================================================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%fashionshop-backend"
set "FRONTEND=%ROOT%fashionshop-frontend"

:: 1. Kiem tra MySQL Service
echo [1/4] Kiem tra dich vu MySQL...
net start 2>nul | findstr /i "MySQL" >nul
if errorlevel 1 (
    echo Dang khoi dong service MySQL...
    net start MySQL92 >nul 2>&1
    if errorlevel 1 net start MySQL >nul 2>&1
    if errorlevel 1 net start MySQL80 >nul 2>&1
)
echo [OK] Dich vu MySQL da san sang.

:: 2. Kiem tra Database
echo.
echo [2/4] Kiem tra Database ecommerce_db...
mysql -u root -p2004 -e "CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
echo [OK] Database da san sang.

:: 3. Kiem tra Frontend config
echo.
echo [3/4] Kiem tra cau hinh Frontend...
if not exist "%FRONTEND%\.env.local" (
    echo NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 > "%FRONTEND%\.env.local"
)
echo [OK] Cau hinh .env.local da san sang.

:: 4. Khoi dong Backend va Frontend
echo.
echo [4/4] Dang khoi dong Backend va Frontend...
start "FashionShop Backend" cmd /c "%BACKEND%\run-backend.bat"

echo Dang cho Backend khoi dong (15 giay)...
timeout /t 15 /nobreak >nul

start "FashionShop Frontend" cmd /c "%FRONTEND%\run-frontend.bat"

timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo =====================================================================
echo    HE THONG DA DUOC KHOI DONG!
echo =====================================================================
echo.
echo   * Frontend Web UI:  http://localhost:3000
echo   * Backend REST API: http://localhost:8080
echo.
echo   Tai khoan mau:
echo   - Admin:    admin@gmail.com    / 123456
echo   - Staff:    staff@gmail.com    / 123456
echo   - Customer: customer@gmail.com / 123456
echo.
echo Nhan phim bat ky de dong cua so trinh khoi dong nay.
pause >nul
