@echo off
echo 🚀 NSE Trading App - One-Click Startup
echo ======================================

REM Kill any existing processes
echo 🧹 Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul || echo No existing Node processes found

REM Wait a moment for cleanup
timeout /t 2 /nobreak >nul

REM Start the application
echo 🚀 Starting application...
node start-app.js

pause