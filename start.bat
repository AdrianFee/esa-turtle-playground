@echo off
REM Double-click me on Windows to start the playground.
cd /d "%~dp0"
python scripts\serve.py
if errorlevel 1 py scripts\serve.py
pause
