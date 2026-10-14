@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title ToffeeCon 2026 - Stadium Offline Edge Server

set "PS_BIN=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS_BIN%" set "PS_BIN=powershell"

echo Discovering stadium local network configuration...
for /f "usebackq tokens=*" %%a in (`"%PS_BIN%" -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' } | Select-Object -ExpandProperty IPAddress -First 1)"`) do (
    set LAN_IP=%%a
)

if "%LAN_IP%"=="" (
    set LAN_IP=127.0.0.1
)

echo(
echo ===============================================================
echo 🎪 TOFFEECON 2026 — STADIUM OFFLINE EDGE SERVER (PORT 5000)
echo ===============================================================
echo(
echo * Local Kiosk URLs for Tablets ^& Stage Displays:
echo   - 🎛️ Mission Control:   http://%LAN_IP%:5000/hub
echo   - 🎪 3-Screen Stage:     http://%LAN_IP%:5000/stage
echo   - 🚪 Entry Gate QR:      http://%LAN_IP%:5000/gate
echo   - 🗳️ Mobile Voting:      http://%LAN_IP%:5000/vote
echo   - 🎙️ The Dub Booth:      http://%LAN_IP%:5000/dub
echo   - 🎭 Audition Booth:     http://%LAN_IP%:5000/audition-booth
echo   - ⏱️ Capsule Booth:      http://%LAN_IP%:5000/capsule-booth
echo   - 🌌 Universe Wall:      http://%LAN_IP%:5000/universe-wall
echo   - 📊 Diagnostics:        http://%LAN_IP%:5000/api/system/diagnostics
echo(
echo ===============================================================
echo Checking container runtime availability...

docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [LAUNCHER] Docker daemon detected. Starting stadium container stack via docker-compose...
    docker compose -f docker-compose.stadium.yml up -d
    echo [LAUNCHER] Stadium edge containers active on port 5000.
    ping 127.0.0.1 -n 3 >nul
    start http://localhost:5000/hub
    echo [LAUNCHER] Edge server running. Press any key to view container logs or Ctrl+C to exit.
    docker compose -f docker-compose.stadium.yml logs -f
) else (
    echo [LAUNCHER] Docker not running or unavailable. Falling back to native Node.js runtime...
    set PORT=5000
    set NODE_ENV=production
    set OFFLINE_STADIUM_MODE=true
    ping 127.0.0.1 -n 2 >nul
    start http://localhost:5000/hub
    echo [LAUNCHER] Booting ToffeeCon EOS Core directly on port 5000...
    node server/server.js
)

pause
