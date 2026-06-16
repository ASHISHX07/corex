@echo off
:: start.bat — run from project root

:: Create logs folder if it doesn't exist
if not exist Data\systemLogs mkdir Data\systemLogs

echo [LAUNCHER] Starting Node...
start /B node --experimental-vm-modules 01_Gateway_Node\index.js > Data\systemLogs\node.log 2>&1

echo [LAUNCHER] Waiting for Node to initialize...
timeout /t 3 /nobreak >nul

echo [LAUNCHER] Starting C++ core...
start /B 03_Core_Cpp\out\build\debug\main.exe > Data\systemLogs\core.log 2>&1

echo [LAUNCHER] Starting Python...
start /B python3 02_Strategies_Python\example.py > Data\systemLogs\python.log 2>&1

echo [LAUNCHER] All processes launched. Press Ctrl+C to stop.
echo [LAUNCHER] Logs: Data\systemLogs\node.log ^| Data\systemLogs\core.log ^| Data\systemLogs\python.log

pause