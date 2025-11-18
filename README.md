# Temple Run Game App

A scalable Temple Run-style endless runner game for Android and iOS, designed to handle 10,000 users initially and scale to 1 million users.

## 🚀 Quick Start

### Backend (Ready to Test!)
✅ **Backend is fully functional** - Test it now:
```bash
docker-compose -f docker-compose.dev.yml up -d
cd backend && npm install && npm run migrate && npm run dev
test-backend.bat  # or ./test-backend.sh on Linux/Mac
```

### Mobile App (2 Options)

**Option 1: Build & Release APK** (Recommended)
```bash
# Automated with GitHub Actions
git tag v1.0.0
git push origin v1.0.0
# Wait 15 min → APK ready on GitHub Releases!
```
👉 **See [RELEASE_GUIDE.md](RELEASE_GUIDE.md)** for complete build & release instructions

**Option 2: Development Setup**
👉 **See [MOBILE_SETUP_REQUIRED.md](MOBILE_SETUP_REQUIRED.md)** for local dev setup

## Architecture Overview

### Technology Stack

#### Mobile App (iOS & Android)
- **Framework**: React Native with TypeScript
- **Game Engine**: React Native Game Engine
- **State Management**: Redux Toolkit
- **Networking**: Axios with retry logic
- **Local Storage**: AsyncStorage

#### Backend Services
- **API Server**: Node.js with Express
- **Authentication**: JWT tokens with refresh mechanism
- **Database**: PostgreSQL (user data, game stats)
- **Cache Layer**: Redis (leaderboards, sessions)
- **Real-time**: WebSocket for live features
- **Load Balancer**: NGINX

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes-ready
- **Auto-scaling**: Horizontal pod autoscaling
- **Monitoring**: Prometheus + Grafana
- **CDN**: CloudFront for static assets

## System Architecture

```
┌─────────────┐     ┌─────────────┐
│   iOS App   │     │ Android App │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
         ┌─────▼──────┐
         │   NGINX    │
         │Load Balance│
         └─────┬──────┘
               │
       ┌───────┴────────┐
       │                │
  ┌────▼────┐     ┌────▼────┐
  │ API     │     │ API     │
  │ Server  │     │ Server  │
  │ (Node)  │     │ (Node)  │
  └────┬────┘     └────┬────┘
       │                │
       └────────┬───────┘
                │
      ┌─────────┴──────────┐
      │                    │
┌─────▼──────┐      ┌──────▼─────┐
│ PostgreSQL │      │   Redis    │
│  Primary   │      │   Cache    │
└────────────┘      └────────────┘
```

## Scalability Features

### Initial Capacity (10K Users)
- 2 API server instances
- Single PostgreSQL instance with connection pooling
- Redis single instance
- Handles 100 concurrent games

### Scale to 1M Users
- Auto-scaling API servers (20+ instances)
- PostgreSQL read replicas + write master
- Redis cluster (3-5 nodes)
- CDN for static assets
- Horizontal pod autoscaling
- Database sharding strategy
- Rate limiting and caching

## Performance Targets

- **API Response Time**: < 100ms (p95)
- **Game FPS**: 60 FPS on mid-range devices
- **Concurrent Users**: 10K initially, 1M at scale
- **Leaderboard Updates**: < 500ms
- **Database Connections**: Pooled (max 100 per instance)

## Project Structure

```
TempleRun/
├── mobile/                 # React Native app
│   ├── android/           # Android native code
│   ├── ios/               # iOS native code
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── game/          # Game engine and logic
│   │   ├── screens/       # App screens
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utilities
│   └── package.json
├── backend/               # Backend services
│   ├── api/              # REST API server
│   ├── database/         # Database migrations
│   ├── services/         # Business logic
│   └── tests/            # API tests
├── infrastructure/        # Deployment configs
│   ├── docker/           # Docker files
│   ├── kubernetes/       # K8s manifests
│   └── nginx/            # NGINX config
└── docs/                 # Documentation

```

## Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Xcode (for iOS)
- Android Studio (for Android)

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd TempleRun
```

2. **Start Backend Services**
```bash
cd backend
npm install
docker-compose up -d  # Start PostgreSQL and Redis
npm run migrate       # Run database migrations
npm run dev          # Start API server
```

3. **Start Mobile App**
```bash
cd mobile
npm install
npx react-native run-android  # For Android
# OR
npx react-native run-ios       # For iOS
```

## Game Features

### Core Gameplay
- Endless running with procedural generation
- Swipe controls (left, right, up, down)
- Obstacles: walls, gaps, barriers
- Collectibles: coins, power-ups
- Progressive difficulty
- Score multipliers

### User Features
- User registration and authentication
- Profile management
- Global leaderboards
- Friends system
- Achievement system
- Daily challenges
- In-game statistics

### Monetization Ready
- Coin shop structure
- Character unlock system
- Power-up store
- Ad integration points

## Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
# Build images
docker-compose build

# Deploy with scaling
docker-compose -f docker-compose.prod.yml up -d --scale api=5

# Or use Kubernetes
kubectl apply -f infrastructure/kubernetes/
```

## Monitoring

- **Health Check**: `GET /api/health`
- **Metrics**: `GET /api/metrics`
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token

### Game
- `POST /game/start` - Start game session
- `POST /game/end` - Submit game score
- `GET /game/stats` - Get user stats

### Leaderboard
- `GET /leaderboard/global` - Global top 100
- `GET /leaderboard/friends` - Friends leaderboard

## Performance Optimization

### Mobile App
- Game loop optimization (60 FPS)
- Asset preloading
- Memory management
- Offline mode support

### Backend
- Connection pooling (pg-pool)
- Redis caching (TTL-based)
- Database indexing
- Query optimization
- Rate limiting (100 req/min per user)

### Scaling Strategy
- **10K users**: Single region, 2-3 servers
- **100K users**: Multi-region, 10-15 servers
- **1M users**: Global CDN, 50+ servers, DB sharding

## Security

- JWT authentication with 15-min expiry
- Refresh token rotation
- Rate limiting per IP and user
- SQL injection prevention (parameterized queries)
- Input validation
- HTTPS only in production
- CORS configuration
- Environment variable secrets

## License

MIT License

## Contributors

Built with scalability in mind for mobile gaming at scale.
