@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_PORT="
set "BACKEND_TITLE=__MaterialsDev_Backend__"
set "FRONTEND_TITLE=__MaterialsDev_Frontend__"
set "RUNTIME_DIR=%ROOT%.dev-runtime"
set "RUNTIME_ENV=%RUNTIME_DIR%\session-env.bat"

for %%P in (8000 8001 8010 18000) do (
  netstat -ano | findstr ":%%P " | findstr "LISTENING" >nul 2>&1
  if errorlevel 1 (
    set "BACKEND_PORT=%%P"
    goto :port_selected
  )
)

:port_selected
if not defined BACKEND_PORT (
  echo ERROR: Could not find an available backend port in [8000, 8001, 8010, 18000].
  echo Please close the process using those ports or edit start-dev.bat.
  exit /b 1
)

echo Starting backend and frontend dev servers...
if not "%BACKEND_PORT%"=="8000" (
  echo Port 8000 is busy. Using backend port %BACKEND_PORT% instead.
)

if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%"
(
  echo set BACKEND_PORT=%BACKEND_PORT%
  echo set BACKEND_TITLE=%BACKEND_TITLE%
  echo set FRONTEND_TITLE=%FRONTEND_TITLE%
)> "%RUNTIME_ENV%"

start "%BACKEND_TITLE%" cmd /k "cd /d ""%ROOT%backend"" && uv run main.py serve --host 127.0.0.1 --port %BACKEND_PORT%"
start "%FRONTEND_TITLE%" cmd /k "cd /d ""%ROOT%frontend"" && set ""VITE_API_BASE=http://127.0.0.1:%BACKEND_PORT%/api"" && npm.cmd run dev"

set /a WAIT_COUNT=0
:wait_frontend
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto :open_browser
if %WAIT_COUNT% GEQ 30 goto :open_browser
set /a WAIT_COUNT+=1
timeout /t 1 /nobreak >nul
goto :wait_frontend

:open_browser
start "" "http://127.0.0.1:5173"

echo.
echo Backend:  http://127.0.0.1:%BACKEND_PORT%
echo Frontend: http://127.0.0.1:5173
echo API Base: http://127.0.0.1:%BACKEND_PORT%/api
echo.
echo Two windows were opened. Close each window to stop its server.
echo Or run stop-dev.bat to close both at once.

endlocal
