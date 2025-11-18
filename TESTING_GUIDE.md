# Testing Guide - Temple Run Backend

## ✅ What's Ready to Test Right Now

The **entire backend** is complete and working! You can test everything without setting up the mobile app.

---

## 🚀 Quick Start - Test Backend (Windows)

### 1. Start Docker Services
```bash
cd C:\path\to\TempleRun
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Start Backend
```bash
cd backend
npm install
copy .env.example .env
notepad .env
```

Add these lines to `.env`:
```
JWT_SECRET=local-dev-secret-temple-run-2024
JWT_REFRESH_SECRET=local-dev-refresh-temple-run-2024
```

```bash
npm run migrate
npm run dev
```

Expected output:
```
Database connection established
Redis client connected
Server running on port 3000
```

### 3. Run Automated Tests

In a **new terminal**:
```bash
cd C:\path\to\TempleRun
test-backend.bat
```

This will automatically test:
- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Get current user
- ✅ Start game session
- ✅ End game session
- ✅ Get global leaderboard
- ✅ Get user stats

---

## 🧪 Manual API Testing

### Using curl (Windows PowerShell):

```powershell
# Health Check
curl http://localhost:3000/health

# Register User
curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"player1\",\"email\":\"player1@test.com\",\"password\":\"password123\"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"player1@test.com\",\"password\":\"password123\"}'

# Copy the token from response, then:

# Get Current User
curl http://localhost:3000/api/v1/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Start Game
curl -X POST http://localhost:3000/api/v1/game/start `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json"

# End Game (use sessionId from previous response)
curl -X POST http://localhost:3000/api/v1/game/end `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"sessionId\":\"SESSION_ID\",\"score\":5000,\"coins\":100,\"distance\":1500.5\"}'

# Get Leaderboard
curl http://localhost:3000/api/v1/leaderboard/global?limit=10
```

---

## 📊 Using Postman (Recommended)

1. **Download Postman**: https://www.postman.com/downloads/

2. **Import Collection**: Create requests for each endpoint from `docs/API.md`

3. **Test Workflow**:
   - Register user → Get token
   - Set token in Authorization header
   - Start game → Get session ID
   - End game → Submit score
   - Check leaderboard → See your rank

---

## 🔍 Verify Database

```bash
# Connect to PostgreSQL
docker exec -it templerun-postgres-dev psql -U postgres -d templerun

# Check tables
\dt

# View users
SELECT * FROM users;

# View game sessions
SELECT * FROM game_sessions ORDER BY score DESC LIMIT 10;

# View leaderboard data
SELECT username, high_score, total_coins, games_played
FROM users
WHERE high_score > 0
ORDER BY high_score DESC
LIMIT 10;

# Exit
\q
```

---

## 🔍 Verify Redis

```bash
# Connect to Redis
docker exec -it templerun-redis-dev redis-cli

# Check leaderboard
ZREVRANGE leaderboard:global 0 9 WITHSCORES

# Exit
exit
```

---

## 📈 Load Testing (Optional)

Want to test with many users? Install k6:

```bash
# Install k6
choco install k6  # Windows with Chocolatey
```

Create `load-test.js`:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let res = http.get('http://localhost:3000/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

Run:
```bash
k6 run load-test.js
```

---

## 🎯 What You Can Test

### ✅ Working Features

| Feature | Status | How to Test |
|---------|--------|-------------|
| User Registration | ✅ | `POST /auth/register` |
| User Login | ✅ | `POST /auth/login` |
| JWT Auth | ✅ | Use token in headers |
| Token Refresh | ✅ | `POST /auth/refresh` |
| Game Sessions | ✅ | `POST /game/start`, `/game/end` |
| Score Submission | ✅ | `POST /game/end` |
| User Stats | ✅ | `GET /game/stats` |
| Global Leaderboard | ✅ | `GET /leaderboard/global` |
| User Rank | ✅ | `GET /leaderboard/rank` |
| Database Persistence | ✅ | Check PostgreSQL |
| Redis Caching | ✅ | Check Redis |
| Rate Limiting | ✅ | Send 101 requests/min |
| Error Handling | ✅ | Send invalid data |
| Input Validation | ✅ | Send malformed JSON |

---

## 🐛 Common Issues

### Backend won't start
```bash
# Check Docker is running
docker ps

# Restart Docker services
docker-compose -f docker-compose.dev.yml restart
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker logs templerun-postgres-dev

# Restart PostgreSQL
docker restart templerun-postgres-dev
```

### "Cannot connect to Redis"
```bash
# Check Redis is running
docker logs templerun-redis-dev

# Restart Redis
docker restart templerun-redis-dev
```

---

## 📚 Next Steps

1. ✅ **Test backend** (you are here)
2. 📱 **Setup mobile app** - See `MOBILE_SETUP_REQUIRED.md`
3. 🚀 **Deploy** - See `docs/DEPLOYMENT.md`

---

## ✨ Summary

**Backend is 100% functional!** You can:
- Create users
- Login/logout
- Play games (via API)
- Submit scores
- View leaderboards
- Track stats

The mobile app just needs native project initialization (10-15 minutes).

All the hard backend work is complete and tested! 🎉
