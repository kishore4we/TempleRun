# 🚀 Release Guide - Publishing Temple Run APK

Quick guide to build and release your Temple Run Android app.

---

## ⚡ Quick Release (2 Minutes)

### Using GitHub Actions (Automatic):

```bash
cd C:\path\to\TempleRun

# Commit any changes
git add -A
git commit -m "Ready for release v1.0.0"
git push

# Create version tag
git tag v1.0.0
git push origin v1.0.0

# Wait 10-15 minutes
# GitHub automatically builds APK and creates release!
```

**Done!** Check: `https://github.com/YOUR_USERNAME/TempleRun/releases`

---

## 🛠️ Manual Build (15 Minutes)

### Windows:

```bash
cd C:\path\to\TempleRun

# Run build script
build-apk.bat

# Enter version: 1.0.0
# Wait 10 minutes
# APK saved to: releases\temple-run-v1.0.0.apk
```

### Upload to GitHub:

1. Go to: `https://github.com/YOUR_USERNAME/TempleRun/releases/new`
2. Tag: `v1.0.0`
3. Title: `Temple Run v1.0.0`
4. Upload: `releases\temple-run-v1.0.0.apk`
5. Click **Publish release**

---

## 📱 Sharing with Users

### Option 1: GitHub Releases (Recommended)

Share this link:
```
https://github.com/YOUR_USERNAME/TempleRun/releases
```

Users can:
1. Click link
2. Download APK
3. Install on Android

### Option 2: QR Code

1. Generate QR code: https://www.qr-code-generator.com/
2. Enter release URL
3. Print or share QR code
4. Users scan and download

### Option 3: Direct File Sharing

1. Upload APK to:
   - Google Drive
   - Dropbox
   - WeTransfer
2. Share link with users

---

## 🎯 Version Numbering

Follow semantic versioning:

- `v1.0.0` - First release
- `v1.0.1` - Bug fixes
- `v1.1.0` - New features
- `v2.0.0` - Major changes

Example:
```bash
git tag v1.0.0  # Initial release
git tag v1.0.1  # Fixed login bug
git tag v1.1.0  # Added power-ups
git tag v2.0.0  # New game modes
```

---

## 📋 Pre-Release Checklist

Before creating a release:

### Backend:
- [ ] Backend is deployed and accessible
- [ ] Database migrations are up to date
- [ ] Redis is running
- [ ] API endpoints tested

### Mobile:
- [ ] App connects to backend successfully
- [ ] All features tested:
  - [ ] User registration
  - [ ] Login/logout
  - [ ] Game plays smoothly (60 FPS)
  - [ ] Coins collected correctly
  - [ ] Leaderboard displays
  - [ ] Profile loads
- [ ] No crashes on startup
- [ ] Works on test device

### Release:
- [ ] Version number updated
- [ ] Release notes written
- [ ] APK tested on physical device
- [ ] Backend URL configured correctly

---

## 📝 Release Notes Template

Use this template for release descriptions:

```markdown
## Temple Run v1.0.0

### 🎮 New Features
- Endless runner gameplay with swipe controls
- Coin collection system
- Global leaderboards
- User authentication

### 🐛 Bug Fixes
- Fixed login token expiration
- Improved collision detection
- Better obstacle generation

### 📊 Performance
- Optimized to 60 FPS
- Reduced APK size to 25 MB
- Faster leaderboard loading

### 📥 Installation
1. Download `temple-run.apk`
2. Enable "Install from Unknown Sources"
3. Install and play!

### ⚙️ Requirements
- Android 5.0+ (API 21)
- 100 MB free space
- Internet connection

### 🔗 Backend
Make sure backend is running at: http://your-api-url.com
```

---

## 🔄 Update Process

To release an update:

1. **Make changes** to code
2. **Test thoroughly**
3. **Update version** number
4. **Create new tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
5. **GitHub Actions builds** new APK
6. **Users download** new version

---

## 🌍 Backend Configuration

### For Testing (Local):

Mobile app connects to: `http://10.0.2.2:3000/api/v1` (Android emulator)

### For Production:

1. Deploy backend to cloud (AWS, Heroku, DigitalOcean)
2. Get production URL: `https://api.yourapp.com`
3. Update `mobile/src/services/apiService.ts`:
   ```typescript
   const API_BASE_URL = 'https://api.yourapp.com/api/v1';
   ```
4. Rebuild APK with production URL

---

## 📊 Tracking Downloads

GitHub shows download stats:
1. Go to Releases
2. Click on release
3. See download count for each asset

---

## 🎓 Pro Tips

### Tip 1: Beta Testing

Create pre-release for beta testers:
```bash
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

Mark as "Pre-release" on GitHub.

### Tip 2: Automated Changelog

Use conventional commits:
```bash
git commit -m "feat: add power-up system"
git commit -m "fix: resolve login bug"
git commit -m "docs: update README"
```

Generate changelog automatically.

### Tip 3: Multiple Environments

Create different builds:
- `temple-run-dev.apk` - Development
- `temple-run-staging.apk` - Staging
- `temple-run-prod.apk` - Production

### Tip 4: App Signing

For Google Play Store:
1. Generate keystore
2. Sign APK
3. Submit to Play Console

See `docs/BUILDING_APK.md` for details.

---

## 🆘 Troubleshooting

### "APK not installing"

**Solution:**
1. Enable "Install from Unknown Sources"
2. Check Android version (need 5.0+)
3. Clear previous installation

### "App crashes on startup"

**Solution:**
1. Check backend is running
2. Verify API URL is correct
3. Check device logs: `adb logcat`

### "GitHub Actions failing"

**Solution:**
1. Check workflow file syntax
2. View logs in Actions tab
3. Ensure all dependencies are specified

---

## 📚 Additional Resources

- **Building APKs**: `docs/BUILDING_APK.md`
- **API Documentation**: `docs/API.md`
- **Backend Deployment**: `docs/DEPLOYMENT.md`
- **Testing Guide**: `TESTING_GUIDE.md`

---

## ✅ Success Checklist

After releasing:

- [ ] APK available on GitHub Releases
- [ ] Download link works
- [ ] APK installs on test device
- [ ] App connects to backend
- [ ] All features work
- [ ] Release notes published
- [ ] Users notified

---

## 🎉 You're Ready!

Now you can:
1. Build APK automatically with GitHub Actions
2. Release updates quickly
3. Share with unlimited users
4. Track downloads
5. Collect feedback
6. Iterate and improve

**Happy releasing!** 🚀
