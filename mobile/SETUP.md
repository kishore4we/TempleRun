# Mobile App Setup Guide

The mobile app is missing the native Android and iOS project files. Here are two options to set it up:

## Option 1: Initialize React Native (Recommended for Production)

### On Windows:

```bash
# 1. Navigate to project root
cd C:\path\to\TempleRun

# 2. Temporarily rename the mobile folder
move mobile mobile-backup

# 3. Create new React Native project
npx react-native init TempleRunMobile --template react-native-template-typescript

# 4. Rename the generated folder
move TempleRunMobile mobile

# 5. Copy our source code back
xcopy /E /I /Y mobile-backup\src mobile\src
xcopy /Y mobile-backup\*.* mobile\

# 6. Install our dependencies
cd mobile
npm install

# 7. For Android - run
npx react-native run-android

# 8. For iOS (Mac only)
npx react-native run-ios
```

## Option 2: Use Expo (Easier, No Native Setup Required)

Expo is easier to set up and doesn't require Android Studio or Xcode.

### 1. Install Expo CLI globally:
```bash
npm install -g expo-cli
```

### 2. Create new Expo project:
```bash
cd C:\path\to\TempleRun
npx create-expo-app mobile-expo --template blank-typescript
cd mobile-expo
```

### 3. Copy our source code:
```bash
xcopy /E /I /Y ..\mobile\src src
```

### 4. Install dependencies:
```bash
npm install @react-navigation/native @react-navigation/stack
npm install @reduxjs/toolkit react-redux
npm install axios
npm install @react-native-async-storage/async-storage
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-safe-area-context react-native-screens

# Expo specific
npx expo install react-native-web react-dom
```

### 5. Update app.json:
```json
{
  "expo": {
    "name": "TempleRun",
    "slug": "temple-run",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a1a"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.templerun.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      },
      "package": "com.templerun.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### 6. Run with Expo:
```bash
npx expo start
```

This will:
- Show a QR code
- Install "Expo Go" app on your phone
- Scan QR code to run the app instantly!

---

## Quick Solution for Testing Backend Only

If you just want to test the backend without the mobile app:

### 1. Test with curl:
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Login
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### 2. Use Postman or Insomnia:
- Download Postman: https://www.postman.com/downloads/
- Import API endpoints from docs/API.md
- Test all backend features

---

## Recommended Approach for Windows

**For easiest setup:** Use **Option 2 (Expo)**

**For production app:** Use **Option 1 (React Native CLI)**

### Why Expo is Easier:
- ✅ No Android Studio needed
- ✅ No Xcode needed (for iOS)
- ✅ Test on real device instantly
- ✅ Hot reload works perfectly
- ✅ Easier to debug

### When to use React Native CLI:
- ✅ Need custom native modules
- ✅ Smaller app size
- ✅ More control over native code
- ✅ Production apps

---

## Current Status

✅ Backend is ready and working
✅ All API endpoints implemented
✅ Database and Redis configured
✅ Mobile app source code is complete

❌ Need to initialize React Native native project
❌ Or switch to Expo for easier development

Choose one option above and follow the steps!
