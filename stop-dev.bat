@echo off
setlocal

set "ROOT=%~dp0"
set "RUNTIME_ENV=%ROOT%.dev-runtime\session-env.bat"
set "BACKEND_TITLE=__MaterialsDev_Backend__"
set "FRONTEND_TITLE=__MaterialsDev_Frontend__"

if exist "%RUNTIME_ENV%" (
  call "%RUNTIME_ENV%"
)

echo Stopping backend and frontend windows...
taskkill /FI "WINDOWTITLE eq %BACKEND_TITLE%*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq %FRONTEND_TITLE%*" /T /F >nul 2>&1
echo Done.

endlocal

