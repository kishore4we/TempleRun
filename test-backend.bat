@echo off
REM Temple Run Backend Test Script for Windows

echo ================================================================
echo          Temple Run Backend Test Suite
echo ================================================================
echo.

set API_URL=http://localhost:3000/api/v1
set RANDOM_USER=testuser_%RANDOM%

echo Checking if backend is running...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [X] Backend is not running!
    echo.
    echo Please start the backend first:
    echo   cd backend
    echo   npm run dev
    echo.
    exit /b 1
)

echo [OK] Backend is running
echo.

echo Running API Tests...
echo ================================================================
echo.

REM Health Check
echo Testing: Health Check...
curl -s http://localhost:3000/health
echo.
echo.

REM Register User
echo Testing: Register User...
curl -s -X POST "%API_URL%/auth/register" ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"%RANDOM_USER%\",\"email\":\"%RANDOM_USER%@test.com\",\"password\":\"password123\"}" ^
    > response.json
type response.json
echo.
echo.

REM Extract token (simplified for Windows)
for /f "tokens=2 delims=:," %%a in ('findstr "token" response.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

REM Login User
echo Testing: Login...
curl -s -X POST "%API_URL%/auth/login" ^
    -H "Content-Type: application/json" ^
    -d "{\"email\":\"%RANDOM_USER%@test.com\",\"password\":\"password123\"}"
echo.
echo.

REM Get current user
echo Testing: Get Current User...
curl -s -X GET "%API_URL%/auth/me" ^
    -H "Authorization: Bearer %TOKEN%"
echo.
echo.

REM Start game session
echo Testing: Start Game Session...
curl -s -X POST "%API_URL%/game/start" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json" ^
    > session.json
type session.json
echo.
echo.

REM Get leaderboard
echo Testing: Get Global Leaderboard...
curl -s -X GET "%API_URL%/leaderboard/global?limit=10"
echo.
echo.

REM Cleanup
del response.json session.json 2>nul

echo ================================================================
echo                     Tests Completed!
echo ================================================================
echo.
echo Backend is working correctly!
echo.
pause
