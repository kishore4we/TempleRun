@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Temple Run Android Build Script
echo ========================================
echo.

REM Set Java Home (adjust path if needed)
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

REM Kill any running Java processes
echo [1/10] Killing existing Java processes...
taskkill /F /IM java.exe 2>nul

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npx is available
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npx is not available
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [2/10] Pulling latest changes...
git pull origin claude/temple-run-game-app-01MEgZgyaxDx2CozrEaZkv88
if %errorlevel% neq 0 (
    echo WARNING: Git pull failed, continuing with local files...
)

REM Check if android folder exists in mobile
if exist "mobile\android" (
    echo [3/10] Android folder exists, skipping project initialization...
    goto :install_deps
)

echo [3/10] Android folder not found, initializing React Native project...

REM Backup mobile folder
if exist "mobile-backup" (
    echo Removing old backup...
    rmdir /S /Q mobile-backup
)

echo Backing up mobile folder...
move mobile mobile-backup
if %errorlevel% neq 0 (
    echo ERROR: Failed to backup mobile folder
    pause
    exit /b 1
)

REM Create new React Native project
echo [4/10] Creating React Native project (this may take a few minutes)...
call npx react-native init TempleRunMobile --template react-native-template-typescript --skip-install
if %errorlevel% neq 0 (
    echo ERROR: Failed to create React Native project
    echo Restoring backup...
    move mobile-backup mobile
    pause
    exit /b 1
)

REM Rename to mobile
move TempleRunMobile mobile

REM Copy source code back
echo [5/10] Copying source code...
xcopy /E /I /Y mobile-backup\src mobile\src
copy /Y mobile-backup\package.json mobile\
copy /Y mobile-backup\babel.config.js mobile\
copy /Y mobile-backup\tsconfig.json mobile\
copy /Y mobile-backup\app.json mobile\

REM Clean up backup
echo Cleaning up backup...
rmdir /S /Q mobile-backup

:install_deps
echo [6/10] Installing dependencies...
cd mobile
call npm install

REM Install additional dependencies
echo [7/10] Installing additional React Native dependencies...
call npm install @react-navigation/native @react-navigation/stack --save
call npm install @reduxjs/toolkit react-redux --save
call npm install axios --save
call npm install @react-native-async-storage/async-storage --save
call npm install react-native-gesture-handler react-native-reanimated --save
call npm install react-native-safe-area-context react-native-screens --save

REM Check if android folder exists now
if not exist "android" (
    echo ERROR: Android folder still not found after initialization
    pause
    exit /b 1
)

echo [8/10] Building Android APK...
cd android

REM Clean previous builds
echo Cleaning previous builds...
call gradlew clean

REM Build release APK
echo Building release APK (this may take several minutes)...
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common fixes:
    echo 1. Make sure JAVA_HOME is set correctly
    echo 2. Accept Android SDK licenses: sdkmanager --licenses
    echo 3. Check that Android SDK is installed
    pause
    exit /b 1
)

echo [9/10] Build completed successfully!
echo.

REM Find the APK
set APK_PATH=app\build\outputs\apk\release\app-release.apk
if exist "%APK_PATH%" (
    echo [10/10] APK Location:
    echo %cd%\%APK_PATH%
    echo.

    REM Copy to project root for easy access
    copy "%APK_PATH%" "..\..\TempleRun.apk" >nul 2>nul
    if %errorlevel% equ 0 (
        echo Also copied to: %SCRIPT_DIR%TempleRun.apk
    )
) else (
    echo APK file not found at expected location
    echo Check: mobile\android\app\build\outputs\apk\
)

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
pause
