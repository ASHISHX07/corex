@echo off
:: stop.bat — only needed if launcher.mjs is not running (emergency kill)
echo [LAUNCHER] Emergency stop...
echo stop > Data\stop.flag
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM main.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM python3.exe >nul 2>&1
echo [LAUNCHER] Done.
