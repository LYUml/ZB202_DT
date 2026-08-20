@echo off
setlocal
cd /d "%~dp0"

where npm.cmd >nul 2>&1
if errorlevel 1 goto no_node

if not exist "node_modules" (
  echo Installing project dependencies for the first run...
  call npm.cmd install
  if errorlevel 1 goto install_failed
)

echo.
echo 1. Local development mode (Vite :5173)
echo 2. Campus network mode (HTTP :8080)
echo.
choice /C 12 /N /M "Choose a mode: "
if errorlevel 2 goto campus_mode
if errorlevel 1 goto dev_mode

:dev_mode
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  start "ZB202 InfluxDB Bridge" /min cmd.exe /k "cd /d ""%~dp0"" && npm.cmd run influx:bridge"
)

powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/overview.html?lang=en' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  start "ZB202 Dev Server" cmd.exe /k "cd /d ""%~dp0"" && npm.cmd run dev -- --host 127.0.0.1 --strictPort"
)

echo Waiting for the ZB202 development server...
for /L %%I in (1,1,30) do (
  powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/overview.html?lang=en' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; exit 1"
  if not errorlevel 1 goto open_browser
  timeout /t 1 /nobreak >nul
)

echo.
echo The server did not become ready within 30 seconds.
echo Check the "ZB202 Dev Server" window for details.
pause
exit /b 1

:open_browser
start "" "http://127.0.0.1:5173/overview.html?lang=en"
exit /b 0

:campus_mode
where python >nul 2>&1
if errorlevel 1 goto no_python

echo Building the production files...
call npm.cmd run build
if errorlevel 1 goto build_failed

set "ZB202_INFLUX_BRIDGE_HOST=0.0.0.0"
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  start "ZB202 InfluxDB Bridge" /min cmd.exe /k "cd /d ""%~dp0"" && set ZB202_INFLUX_BRIDGE_HOST=0.0.0.0 && npm.cmd run influx:bridge"
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  start "ZB202 HTTP Server" cmd.exe /k "cd /d ""%~dp0"" && python -m http.server 8080 --directory dist --bind 0.0.0.0"
)

echo.
echo Campus mode is running.
echo Other devices can open: http://YOUR-CAMPUS-IP:8080/overview.html
start "" "http://127.0.0.1:8080/overview.html?lang=en"
exit /b 0

:no_node
echo.
echo Node.js and npm were not found.
echo Install Node.js 20.19 or newer, then double-click this file again.
pause
exit /b 1

:install_failed
echo.
echo npm install failed. Review the message above and try again.
pause
exit /b 1

:no_python
echo.
echo Python was not found. Install Python, then double-click this file again.
pause
exit /b 1

:build_failed
echo.
echo Production build failed. Review the message above and try again.
pause
exit /b 1
