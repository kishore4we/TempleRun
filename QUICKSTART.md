# Temple Run - Quick Start Guide

Get your Temple Run game up and running in minutes!

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **Docker** & Docker Compose ([Download](https://docker.com))
- **React Native CLI** (for mobile development)
- **Xcode** (for iOS - Mac only)
- **Android Studio** (for Android)

## 🚀 Quick Setup (5 minutes)

### 1. Automated Setup

```bash
# Clone the repository
git clone <repository-url>
cd TempleRun

# Run setup script (handles everything)
./scripts/setup.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Start Docker services (PostgreSQL, Redis)
- ✅ Run database migrations

### 2. Start Backend API

```bash
cd backend
npm run dev
```

Backend API will be available at: **http://localhost:3000**

### 3. Start Mobile App

#### For Android:
```bash
cd mobile
npx react-native run-android
```

#### For iOS (Mac only):
```bash
cd mobile
npx react-native run-ios
```

## 🎮 Using the App

1. **Launch the app** on your device/emulator
2. **Register** a new account or continue as guest
3. **Play** the game using swipe gestures:
   - Swipe **LEFT/RIGHT** to change lanes
   - Swipe **UP** to jump
   - Swipe **DOWN** to slide
4. **Collect coins** and **avoid obstacles**
5. **Check leaderboards** to see how you rank

## 📊 Admin Access

### View Database
```bash
# PostgreSQL
docker exec -it templerun-postgres psql -U postgres -d templerun

# Common queries
SELECT * FROM users;
SELECT * FROM game_sessions ORDER BY score DESC LIMIT 10;
```

### View Redis Cache
```bash
# Redis
docker exec -it templerun-redis redis-cli

# Check leaderboard
ZREVRANGE leaderboard:global 0 9 WITHSCORES
```

### API Health Check
```bash
curl http://localhost:3000/health
```

## 🐳 Production Deployment

### Docker (Simple)
```bash
docker-compose up -d
```

### Kubernetes (Scalable)
```bash
./scripts/deploy.sh kubernetes
```

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for detailed deployment instructions.

## 📱 Building for Production

### Android APK
```bash
cd mobile/android
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA
```bash
cd mobile/ios
xcodebuild -scheme TempleRun -configuration Release
```

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL and Redis are running
docker-compose -f docker-compose.dev.yml ps

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Mobile app connection issues
```bash
# For Android, check if backend URL is correct
# Edit mobile/src/services/apiService.ts
# Change localhost to your computer's IP address (e.g., 192.168.1.100)
```

### Database connection errors
```bash
# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
cd backend && npm run migrate
```

## 📚 Documentation

- **[README.md](README.md)** - Architecture overview
- **[docs/API.md](docs/API.md)** - API documentation
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide

## 🎯 Next Steps

1. **Customize** the game (colors, obstacles, characters)
2. **Add features** (power-ups, achievements, daily challenges)
3. **Deploy** to production
4. **Scale** to support millions of users

## 💡 Tips

- Use **guest mode** for testing without authentication
- Monitor API logs: `docker logs -f templerun-api`
- Check mobile logs: `npx react-native log-android` or `npx react-native log-ios`
- Use Redux DevTools for debugging state

## 🆘 Need Help?

- Check the **docs/** folder for detailed guides
- Review **API.md** for endpoint documentation
- See **DEPLOYMENT.md** for scaling strategies

Happy Running! 🏃‍♂️💨
