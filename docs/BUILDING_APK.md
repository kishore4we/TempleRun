# Building Android APK - Complete Guide

This guide will help you build a standalone Android APK and release it on GitHub.

---

## 🎯 Method 1: Automated GitHub Actions (Recommended)

GitHub will automatically build the APK for you whenever you push code!

### Setup (One-time):

1. **Push your code to GitHub** (if not already done)
2. **Enable GitHub Actions** in your repository settings
3. The workflow file is already committed (`.github/workflows/build-apk.yml`)

### How it works:

Every time you push to the `main` branch or create a tag:
1. ✅ GitHub automatically builds the Android APK
2. ✅ Creates a release with the APK attached
3. ✅ Anyone can download and install

### Trigger a build:

```bash
# Create a version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will:
# - Build the APK
# - Create a release
# - Upload the APK
```

### Download the APK:

1. Go to `https://github.com/YOUR_USERNAME/TempleRun/releases`
2. Download `app-release.apk`
3. Install on Android phone

---

## 🛠️ Method 2: Build Locally with React Native

Build the APK on your Windows machine.

### Prerequisites:

1. **Android Studio** installed
2. **Java JDK** installed
3. **Environment variables** configured

### Quick Check:

```bash
# Check Java
java -version

# Check Android SDK
echo %ANDROID_HOME%
```

### Build Steps:

```bash
cd C:\path\to\TempleRun

# Run the build script
build-apk.bat
```

The script will:
1. ✅ Setup React Native project
2. ✅ Copy game source code
3. ✅ Install dependencies
4. ✅ Build release APK
5. ✅ Copy APK to `releases/` folder

**Output:** `releases/temple-run-v1.0.0.apk`

---

## 📦 Method 3: Build with Expo EAS

Use Expo's cloud build service.

### Prerequisites:

```bash
npm install -g eas-cli
```

### Build:

```bash
cd TempleRunApp

# Login
eas login

# Build APK
eas build --platform android --profile preview

# Wait 15-20 minutes
# Download APK from link provided
```

---

## 🚀 Releasing on GitHub

### Option A: Automatic (with GitHub Actions)

Just create a git tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions handles everything!

### Option B: Manual Release

1. Build APK locally (use `build-apk.bat`)
2. Go to GitHub → Releases → New Release
3. Tag: `v1.0.0`
4. Upload `app-release.apk`
5. Publish

---

## 📲 Installing on Android Phone

### Method 1: Direct Download

1. On phone, go to: `https://github.com/YOUR_USERNAME/TempleRun/releases`
2. Download `app-release.apk`
3. Android asks: "Install from Unknown Sources?"
4. Allow and install
5. Play! 🎮

### Method 2: Download on PC, Transfer to Phone

1. Download APK on PC
2. Connect phone via USB
3. Copy APK to phone
4. Open file manager on phone
5. Tap APK to install

### Method 3: QR Code

1. Generate QR code for release URL
2. Use: https://www.qr-code-generator.com/
3. Scan with phone
4. Download and install

---

## 🔒 App Signing (For Google Play Store)

If you want to publish on Google Play Store:

### Generate Keystore:

```bash
cd android\app

keytool -genkeypair -v -storetype PKCS12 -keystore temple-run.keystore ^
  -alias temple-run-key ^
  -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Gradle:

Edit `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=temple-run.keystore
MYAPP_RELEASE_KEY_ALIAS=temple-run-key
MYAPP_RELEASE_STORE_PASSWORD=your-password
MYAPP_RELEASE_KEY_PASSWORD=your-password
```

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 📊 Build Comparison

| Method | Time | Requires | Best For |
|--------|------|----------|----------|
| GitHub Actions | 10-15 min | Just GitHub | Auto releases |
| Local Build | 5-10 min | Android Studio | Quick testing |
| Expo EAS | 15-20 min | Expo account | No setup |

---

## 🎯 Recommended Workflow

1. **Development**: Use Expo Go for instant testing
2. **Testing**: Build APK locally, share with testers
3. **Release**: Use GitHub Actions for automatic builds
4. **Production**: Sign APK and publish to Google Play Store

---

## 🐛 Troubleshooting

### "Android SDK not found"

```bash
# Set environment variable
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# Restart terminal
```

### "Gradle build failed"

```bash
cd android
.\gradlew clean
.\gradlew assembleRelease --info
```

### "Out of memory"

Edit `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

---

## ✅ Success Checklist

After building:

- [ ] APK file exists (20-30 MB)
- [ ] Can install on Android phone
- [ ] App opens without crashing
- [ ] Can register/login
- [ ] Game plays smoothly
- [ ] Leaderboard works

---

## 🌟 Next Steps

1. Build and test APK locally
2. Setup GitHub Actions for auto-builds
3. Create first release (v1.0.0)
4. Share with friends!
5. Collect feedback
6. Iterate and improve

---

## 📚 Additional Resources

- **React Native Docs**: https://reactnative.dev/docs/signed-apk-android
- **Expo Build**: https://docs.expo.dev/build/introduction/
- **GitHub Actions**: https://docs.github.com/en/actions

---

**The automated build system is ready!** Just push a tag and GitHub will build your APK automatically. 🚀
