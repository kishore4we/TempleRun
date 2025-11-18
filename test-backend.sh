#!/bin/bash

# Temple Run Backend Test Script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Temple Run Backend Test Suite                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" -H "Authorization: Bearer $TOKEN")
        fi
    else
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data")
        fi
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        # Extract token from registration/login
        if [[ "$endpoint" == *"register"* ]] || [[ "$endpoint" == *"login"* ]]; then
            TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        echo "   Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "Checking if backend is running..."
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${RED}✗ Backend is not running!${NC}"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Run tests
echo "Running API Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Health check
test_endpoint "Health Check" "GET" "/../../health" "" "200"
echo ""

# Authentication tests
echo "Authentication Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RANDOM_USER="testuser_$RANDOM"
test_endpoint "Register User" "POST" "/auth/register" \
    "{\"username\":\"$RANDOM_USER\",\"email\":\"$RANDOM_USER@test.com\",\"password\":\"password123\"}" \
    "201"

test_endpoint "Login User" "POST" "/auth/login" \
    "{\"email\":\"$RANDOM_USER@test.com\",\"password\":\"password123\"}" \
    "200"

test_endpoint "Get Current User" "GET" "/auth/me" "" "200"

echo ""

# Game tests
echo "Game Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SESSION_RESPONSE=$(curl -s -X POST "$API_URL/game/start" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$SESSION_ID" ]; then
    echo -e "Start Game Session... ${GREEN}✓ PASSED${NC} (Session ID: ${SESSION_ID:0:8}...)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    test_endpoint "End Game Session" "POST" "/game/end" \
        "{\"sessionId\":\"$SESSION_ID\",\"score\":5000,\"coins\":100,\"distance\":1000.5}" \
        "200"
else
    echo -e "Start Game Session... ${RED}✗ FAILED${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

test_endpoint "Get User Stats" "GET" "/game/stats" "" "200"

echo ""

# Leaderboard tests
echo "Leaderboard Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Get Global Leaderboard" "GET" "/leaderboard/global?limit=10" "" "200"
test_endpoint "Get User Rank" "GET" "/leaderboard/rank" "" "200"

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        Test Summary                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Backend is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
