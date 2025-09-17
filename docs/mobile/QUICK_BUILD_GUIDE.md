# Quick APK Build Guide - Driver Monitoring System

## 🚀 Fastest Method - EAS Build (15 mins)

### Prerequisites
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account (create free account at expo.dev)
eas login
```

### Step-by-Step Build

1. **Navigate to mobile app**
```bash
cd D:\final_app\mobile-app
```

2. **Configure EAS** (first time only)
```bash
eas build:configure
```

3. **Start the build**
```bash
# For testing/development APK
eas build --platform android --profile preview

# For production APK
eas build --platform android --profile production
```

4. **Wait for build** (~15-20 minutes)
   - You'll see a build URL in the terminal
   - Check status at: https://expo.dev/accounts/YOUR_USERNAME/projects

5. **Download APK**
   - Click the build URL when complete
   - Download APK directly to your phone or computer

## 📱 Installing on Android Device

### Method 1: Direct Install
1. Send APK to phone (email, WhatsApp, Google Drive)
2. Open APK on phone
3. Enable "Install from Unknown Sources" if prompted
4. Install and run

### Method 2: Using ADB
```bash
# Connect phone with USB debugging enabled
adb install path/to/your-app.apk
```

## ⚙️ Required Configuration

### Update app.json before building:
```json
{
  "expo": {
    "name": "Driver Monitor",
    "slug": "driver-monitor",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.drivermonitor",
      "versionCode": 1,
      "permissions": ["CAMERA"]
    }
  }
}
```

### Create/Update eas.json:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🔧 Local Build Alternative (if EAS fails)

```bash
# 1. Prebuild the native project
npx expo prebuild --platform android

# 2. Go to android folder
cd android

# 3. Build APK
./gradlew assembleRelease
# Windows: gradlew.bat assembleRelease

# 4. Find APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

## ⚠️ Common Issues & Fixes

### Issue: "Cannot find module expo-modules-core"
```bash
npm install expo-modules-core --legacy-peer-deps
```

### Issue: Build fails with asset errors
```bash
npm run generate-assets
```

### Issue: Camera not working in APK
Ensure permissions in app.json:
```json
"permissions": ["CAMERA", "RECORD_AUDIO"]
```

### Issue: APK crashes on launch
Check if API URL is set correctly:
```bash
# Create .env file in mobile-app folder
echo "EXPO_PUBLIC_API_URL=http://your-backend-ip:3001" > .env
```

## 📊 Build Status Monitoring

Track your build at:
- https://expo.dev/accounts/[YOUR_USERNAME]/builds
- Or run: `eas build:list`

## 🎯 Quick Commands Reference

```bash
# Configure EAS (first time)
eas build:configure

# Build development APK
eas build -p android --profile development

# Build production APK
eas build -p android --profile production

# List all builds
eas build:list

# Cancel running build
eas build:cancel [BUILD_ID]

# Download latest build
eas build:download --platform android
```

## 📝 Pre-Build Checklist

- [ ] Expo account created and logged in
- [ ] app.json configured with correct package name
- [ ] eas.json exists with APK build configuration
- [ ] Assets (icon, splash) are present
- [ ] Environment variables set (.env file)
- [ ] Version number updated if needed

## 💡 Tips

1. **First build takes longer** (20-30 mins) as it sets up credentials
2. **Subsequent builds are faster** (10-15 mins)
3. **Use preview profile** for testing
4. **Use production profile** for release
5. **Keep keystore safe** if you generate one

## 🆘 Need Help?

- Run `eas build --help` for command options
- Check build logs: `eas build:view [BUILD_ID]`
- Expo Discord: https://chat.expo.dev
- Create issue in project repository

---

**Quick Build Command:**
```bash
cd D:\final_app\mobile-app && eas build -p android --profile preview
```

That's it! Your APK will be ready in ~15 minutes! 🎉