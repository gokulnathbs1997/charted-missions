@echo off
REM Starts the online multiplayer server (needs Node.js 18+ from https://nodejs.org).
cd /d "%~dp0"
node server\server.mjs
pause
