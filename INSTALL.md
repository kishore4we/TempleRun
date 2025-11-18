# Temple Run - Installation Guide

## ✅ Step-by-Step Installation

### Current Directory Structure
```
/home/user/TempleRun/          ← You are here
├── backend/
│   └── package.json           ✅ EXISTS
├── mobile/
│   └── package.json           ✅ EXISTS
└── scripts/
    └── setup.sh
```

---

## 🚀 Method 1: Automated Setup (Recommended)

```bash
# Make sure you're in the TempleRun directory
pwd  # Should show: /home/user/TempleRun

# Run automated setup script
./scripts/setup.sh
```

This script automatically:
1. Checks prerequisites
2. Installs backend dependencies
3. Installs mobile dependencies
4. Starts Docker services
5. Runs database migrations

---

## 🔧 Method 2: Manual Setup

### Step 1: Start Docker Services

```bash
# From: /home/user/TempleRun
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd /home/user/TempleRun/backend

# Verify package.json exists
ls -la package.json
# Output should show: -rw-r--r-- 1 root root 1347 Nov 18 15:20 package.json

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run database migrations
npm run migrate

# Start backend server
npm run dev
```

**Backend will run on:** `http://localhost:3000`

### Step 3: Setup Mobile App

```bash
# Navigate to mobile directory
cd /home/user/TempleRun/mobile

# Verify package.json exists
ls -la package.json
# Output should show: -rw-r--r-- 1 root root 1692 Nov 18 15:16 package.json

# Install dependencies
npm install

# For Android
npx react-native run-android

# OR for iOS (Mac only)
npx react-native run-ios
```

---

## 📋 Verify Installation

### Check Backend
```bash
# From any directory
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### Check Database
```bash
# PostgreSQL
docker exec -it templerun-postgres-dev psql -U postgres -d templerun -c "\dt"

# Expected: Should show tables: users, game_sessions, achievements, user_achievements
```

### Check Redis
```bash
# Redis
docker exec -it templerun-redis-dev redis-cli ping

# Expected: PONG
```

---

## 🐛 Troubleshooting

### "npm: command not found"
```bash
# Install Node.js 18+
# Visit: https://nodejs.org
```

### "Cannot find package.json"
```bash
# Check current directory
pwd

# Navigate to correct directory
cd /home/user/TempleRun/backend
# OR
cd /home/user/TempleRun/mobile

# Then run npm install
```

### "Docker daemon not running"
```bash
# Start Docker
sudo systemctl start docker  # Linux
# OR open Docker Desktop (Mac/Windows)
```

### "Port 5432 already in use"
```bash
# Stop existing PostgreSQL
sudo systemctl stop postgresql
# OR change port in docker-compose.dev.yml
```

---

## 📝 Quick Reference

| Directory | Command | Purpose |
|-----------|---------|---------|
| `/home/user/TempleRun` | `./scripts/setup.sh` | Automated full setup |
| `/home/user/TempleRun` | `docker-compose -f docker-compose.dev.yml up -d` | Start Docker services |
| `/home/user/TempleRun/backend` | `npm install` | Install backend deps |
| `/home/user/TempleRun/backend` | `npm run dev` | Start backend server |
| `/home/user/TempleRun/mobile` | `npm install` | Install mobile deps |
| `/home/user/TempleRun/mobile` | `npx react-native run-android` | Run on Android |
| `/home/user/TempleRun/mobile` | `npx react-native run-ios` | Run on iOS |

---

## ✨ Next Steps After Installation

1. **Open mobile app** on your device/emulator
2. **Register a new account** or continue as guest
3. **Play the game** using swipe gestures
4. **Check leaderboards** to see rankings

---

## 🆘 Still Having Issues?

Run this diagnostic script:

```bash
cd /home/user/TempleRun

echo "=== Checking Prerequisites ==="
node --version
npm --version
docker --version
docker-compose --version

echo ""
echo "=== Checking Files ==="
ls -la backend/package.json
ls -la mobile/package.json

echo ""
echo "=== Checking Docker Services ==="
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "=== Checking Ports ==="
netstat -tuln | grep -E ':(3000|5432|6379)'
```

If you see all files and services, you're good to go! 🎉
