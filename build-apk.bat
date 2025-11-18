@echo off
REM Temple Run - Android APK Build Script for Windows

echo ================================================================
echo          Temple Run - APK Build Script
echo ================================================================
echo.

REM Check prerequisites
echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not found!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check Java
where java >nul 2>&1
if errorlevel 1 (
    echo [X] Java not found!
    echo Please install Java JDK 17 or higher
    pause
    exit /b 1
)
echo [OK] Java found
java -version

REM Check Android SDK
if not defined ANDROID_HOME (
    echo [X] ANDROID_HOME not set!
    echo Please install Android Studio and set ANDROID_HOME
    pause
    exit /b 1
)
echo [OK] Android SDK found: %ANDROID_HOME%

echo.
echo ================================================================
echo.

REM Get version number
set /p VERSION="Enter version number (e.g., 1.0.0): "
if "%VERSION%"=="" set VERSION=1.0.0

echo.
echo Building Temple Run v%VERSION%...
echo.

REM Create build directory
if exist TempleRunBuild (
    echo Cleaning previous build...
    rmdir /s /q TempleRunBuild
)

echo.
echo Step 1/6: Creating React Native project...
echo (This may take 2-3 minutes)
echo.

REM Using React Native 0.74.0 which has proper template support
call npx @react-native-community/cli@13.6.4 init TempleRunBuild --version 0.74.0 --skip-install

if errorlevel 1 (
    echo [X] Failed to create React Native project
    pause
    exit /b 1
)

echo.
echo Step 2/6: Copying game source code...
echo.

xcopy /E /I /Y mobile\src TempleRunBuild\src
copy /Y mobile\tsconfig.json TempleRunBuild\
copy /Y mobile\babel.config.js TempleRunBuild\
copy /Y mobile\metro.config.js TempleRunBuild\
copy /Y mobile\index.js TempleRunBuild\

echo.
echo Step 3/6: Installing dependencies...
echo.

cd TempleRunBuild

call npm install
call npm install --save ^
    @react-navigation/native@^6.1.9 ^
    @react-navigation/stack@^6.3.20 ^
    @reduxjs/toolkit@^1.9.7 ^
    react-redux@^8.1.3 ^
    axios@^1.6.0 ^
    @react-native-async-storage/async-storage@^1.19.5 ^
    react-native-gesture-handler@^2.13.4 ^
    react-native-reanimated@^3.5.4 ^
    react-native-safe-area-context@^4.7.4 ^
    react-native-screens@^3.27.0

echo.
echo Step 4/6: Preparing Android build...
echo.

cd android

echo.
echo Step 5/6: Building release APK...
echo (This may take 5-10 minutes)
echo.

call gradlew assembleRelease

if errorlevel 1 (
    echo [X] Build failed!
    cd ..\..
    pause
    exit /b 1
)

echo.
echo Step 6/6: Copying APK to releases folder...
echo.

cd ..\..

if not exist releases mkdir releases

copy /Y TempleRunBuild\android\app\build\outputs\apk\release\app-release.apk releases\temple-run-v%VERSION%.apk

echo.
echo ================================================================
echo                    Build Complete!
echo ================================================================
echo.
echo APK Location: releases\temple-run-v%VERSION%.apk
echo.
echo File size:
dir releases\temple-run-v%VERSION%.apk | findstr "apk"
echo.
echo ================================================================
echo.
echo Next steps:
echo 1. Test APK on Android device
echo 2. Upload to GitHub Releases
echo 3. Share with users!
echo.
echo To upload to GitHub:
echo   git tag v%VERSION%
echo   git push origin v%VERSION%
echo.
echo Or manually upload at:
echo   https://github.com/YOUR_USERNAME/TempleRun/releases/new
echo.
echo ================================================================
echo.

REM Open releases folder
explorer releases

pause
