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

powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/overview.html?lang=zh' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  start "ZB202 Dev Server" cmd.exe /k "cd /d ""%~dp0"" && npm.cmd run dev -- --host 127.0.0.1 --strictPort"
)

echo Waiting for the ZB202 development server...
for /L %%I in (1,1,30) do (
  powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/overview.html?lang=zh' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; exit 1"
  if not errorlevel 1 goto open_browser
  timeout /t 1 /nobreak >nul
)

echo.
echo The server did not become ready within 30 seconds.
echo Check the "ZB202 Dev Server" window for details.
pause
exit /b 1

:open_browser
start "" "http://127.0.0.1:5173/overview.html?lang=zh"
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
