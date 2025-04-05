@echo off
cd /d C:\Users\r0nw4\ARTlab\ART\interface

:: Start Executor Server (server.js)
start /min cmd /k "cd C:\Users\r0nw4\ARTlab\ART & node server.js"

:: Start Vite dev server
start /min cmd /k "npm run dev"

:: Wait for servers (5s)
timeout /t 5 >nul

:: Start Electron
start /min cmd /k "npx electron ."

echo ART Full Stack started! Executor, Vite, and Electron running.
pause