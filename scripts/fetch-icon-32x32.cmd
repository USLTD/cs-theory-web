@echo off
setlocal

:: Get the project root folder (one level up from where this script sits)
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"

:: Define exact target path
set "ICON_DIR=%PROJECT_ROOT%\assets\icons\32x32"

:: Create the nested directories cleanly in one shot if they don't exist
if not exist "%ICON_DIR%\" (
  mkdir "%ICON_DIR%"
)

:: Jump directly to the target folder
cd /d "%ICON_DIR%"

:loop
if "%~1"=="" goto end

if not exist "%~1.png" (
  curl --remote-name "https://raw.githubusercontent.com/gammasoft/fatcow/refs/heads/master/32x32/%~1.png"
)

shift
goto loop

:end
endlocal
