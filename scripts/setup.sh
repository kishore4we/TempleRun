#!/bin/bash

# Temple Run Setup Script
# This script sets up the development environment

set -e

echo "🏃 Temple Run Setup Script"
echo "=========================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Setup backend
echo "Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your configuration."
fi

echo "Installing backend dependencies..."
npm install

echo "✅ Backend setup complete"
echo ""

# Setup mobile app
echo "Setting up mobile app..."
cd ../mobile

echo "Installing mobile dependencies..."
npm install

echo "✅ Mobile app setup complete"
echo ""

# Start Docker services
echo "Starting Docker services (PostgreSQL and Redis)..."
cd ..
docker-compose -f docker-compose.dev.yml up -d

echo "Waiting for services to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
cd backend
npm run migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your configuration"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the mobile app:"
echo "   - Android: cd mobile && npx react-native run-android"
echo "   - iOS: cd mobile && npx react-native run-ios"
echo ""
echo "📚 Read docs/DEPLOYMENT.md for deployment instructions"
