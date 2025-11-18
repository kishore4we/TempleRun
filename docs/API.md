# Temple Run API Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "player123",
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "player123",
      "email": "player@example.com",
      "highScore": 0,
      "totalCoins": 0,
      "gamesPlayed": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token"
  }
}
```

#### GET /auth/me
Get current user profile (requires authentication).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "player123",
    "email": "player@example.com",
    "highScore": 50000,
    "totalCoins": 1234,
    "gamesPlayed": 42,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Game

#### POST /game/start
Start a new game session.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "unique-session-id"
  }
}
```

#### POST /game/end
End game session and submit score.

**Request Body:**
```json
{
  "sessionId": "unique-session-id",
  "score": 50000,
  "coins": 150,
  "distance": 5000.5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Game session ended successfully"
}
```

#### GET /game/stats
Get user's game statistics (requires authentication).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_games": "42",
    "highest_score": "50000",
    "total_coins": "1234",
    "total_distance": "50000.50",
    "average_score": "25000.5",
    "currentHighScore": 50000,
    "currentTotalCoins": 1234
  }
}
```

### Leaderboard

#### GET /leaderboard/global
Get global leaderboard.

**Query Parameters:**
- `limit` (optional): Number of entries (default: 100, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "topPlayer",
      "score": 100000,
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "rank": 2,
      "userId": "uuid",
      "username": "player2",
      "score": 95000,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /leaderboard/friends
Get friends leaderboard (requires authentication).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [],
  "message": "Friends system not yet implemented"
}
```

#### GET /leaderboard/rank
Get current user's rank (requires authentication).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "rank": 42
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per minute per IP
- **Burst**: Up to 20 requests above limit

## WebSocket Events (Future)

For real-time leaderboard updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Listen for leaderboard updates
ws.on('leaderboard:update', (data) => {
  console.log('Leaderboard updated:', data);
});
```
