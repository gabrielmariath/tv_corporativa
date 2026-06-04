@echo off
title TV Corporativa ID Moveis - Tela cheia
cd /d "%~dp0"
start chrome --kiosk http://localhost:3000
node server.js
pause
