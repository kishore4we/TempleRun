#!/bin/bash

# Temple Run Setup Verification Script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Temple Run - Setup Verification                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NOT FOUND"
        return 1
    fi
}

check_command() {
    if command -v $1 &> /dev/null; then
        version=$($1 --version 2>&1 | head -n1)
        echo -e "${GREEN}✓${NC} $1 installed: $version"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NOT FOUND"
        return 1
    fi
}

# Check prerequisites
echo "Checking Prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_command node
check_command npm
check_command docker
check_command docker-compose
echo ""

# Check package.json files
echo "Checking Package Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "backend/package.json"
check_file "mobile/package.json"
check_file "backend/tsconfig.json"
check_file "mobile/tsconfig.json"
echo ""

# Check configuration files
echo "Checking Configuration Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "backend/.env.example"
check_file "docker-compose.yml"
check_file "docker-compose.dev.yml"
echo ""

# Check scripts
echo "Checking Scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "scripts/setup.sh"
check_file "scripts/deploy.sh"
echo ""

# Check documentation
echo "Checking Documentation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "INSTALL.md"
check_file "docs/API.md"
check_file "docs/DEPLOYMENT.md"
echo ""

# Validate JSON files
echo "Validating JSON Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if python3 -m json.tool backend/package.json > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} backend/package.json is valid JSON"
else
    echo -e "${RED}✗${NC} backend/package.json has JSON errors"
fi

if python3 -m json.tool mobile/package.json > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} mobile/package.json is valid JSON"
else
    echo -e "${RED}✗${NC} mobile/package.json has JSON errors"
fi
echo ""

# Check Docker services
echo "Checking Docker Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Docker services are running"
    docker-compose -f docker-compose.dev.yml ps
else
    echo -e "${YELLOW}!${NC} Docker services not running (run: docker-compose -f docker-compose.dev.yml up -d)"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        Summary                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "If all checks passed, you're ready to install!"
echo ""
echo "Next steps:"
echo "  1. Run: cd backend && npm install"
echo "  2. Run: cd mobile && npm install"
echo "  3. Or use: ./scripts/setup.sh (automated)"
echo ""
