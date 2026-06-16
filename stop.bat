@echo off
echo [LAUNCHER] stopping all processes...

taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM main.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
