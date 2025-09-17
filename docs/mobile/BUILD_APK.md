# Building APK for Driver Monitoring System

This guide provides step-by-step instructions for building an Android APK for the Driver Monitoring System mobile app.

## Prerequisites

Before building the APK, ensure you have:

1. **Node.js** (v18 or higher)
2. **Expo CLI** installed globally
3. **EAS CLI** for building with Expo Application Services
4. **Android Studio** (for local builds only)
5. **Expo account** (free tier works)

## Installation

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo Account

```bash
eas login
# Enter your Expo credentials
```

### 3. Configure Project

Navigate to the mobile app directory:

```bash
cd D:\final_app\mobile-app
```

## Building APK Options

You have three options for building the APK:

### Option 1: EAS Build (Recommended) - Cloud Build

#### Step 1: Initialize EAS Build

```bash
eas build:configure
```

This creates an `eas.json` configuration file.

#### Step 2: Update eas.json

Edit `eas.json` to include:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
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

#### Step 3: Build APK

For development build:
```bash
eas build --platform android --profile development
```

For production build:
```bash
eas build --platform android --profile production
```

#### Step 4: Download APK

After the build completes (15-20 minutes), you'll receive a URL to download the APK.

### Option 2: Local Build with Expo (Faster)

#### Step 1: Install Expo Dev Client

```bash
npx expo install expo-dev-client
```

#### Step 2: Prebuild Android

```bash
npx expo prebuild --platform android
```

#### Step 3: Run Gradle Build

```bash
cd android
./gradlew assembleRelease
# On Windows: gradlew.bat assembleRelease
```

#### Step 4: Find APK

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Option 3: Expo Classic Build (Deprecated but works)

```bash
expo build:android -t apk
```

Note: This method is deprecated and will be removed in future Expo versions.

## Configuration Before Building

### 1. Update app.json

Ensure your `app.json` has the correct configuration:

```json
{
  "expo": {
    "name": "Driver Monitor",
    "slug": "driver-monitor",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.drivermonitor.app",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO"
      ],
      "versionCode": 1
    }
  }
}
```

### 2. Environment Variables

Create a `.env.production` file:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

### 3. Generate Assets

Ensure all required assets exist:

```bash
npm run generate-assets
```

## Signing the APK (Production Only)

### Generate Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore driver-monitor.keystore -alias driver-monitor -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing in eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

### Create credentials.json

```json
{
  "android": {
    "keystore": {
      "keystorePath": "./driver-monitor.keystore",
      "keystorePassword": "your-keystore-password",
      "keyAlias": "driver-monitor",
      "keyPassword": "your-key-password"
    }
  }
}
```

## Optimizing APK Size

### 1. Enable ProGuard

In `android/app/build.gradle`:

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. Build APK per ABI

```bash
eas build --platform android --profile production
```

Add to eas.json:
```json
{
  "production": {
    "android": {
      "buildType": "apk",
      "gradleCommand": ":app:assembleRelease",
      "artifactPath": "android/app/build/outputs/apk/release/*.apk"
    }
  }
}
```

## Testing the APK

### 1. Install on Device

#### Via ADB:
```bash
adb install app-release.apk
```

#### Via Email/Cloud:
- Upload APK to Google Drive or email
- Enable "Install from Unknown Sources" on device
- Download and install

### 2. Test Checklist

- [ ] Camera permissions work
- [ ] Face detection runs smoothly
- [ ] Alerts trigger correctly
- [ ] Data persists after app restart
- [ ] Sync works when online
- [ ] Battery optimization functions
- [ ] All navigation flows work

## Troubleshooting

### Common Issues

#### 1. Build Fails with "SDK not found"

```bash
# Set Android SDK path
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
# On Windows: set ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk
```

#### 2. Camera Not Working

Ensure permissions in `app.json`:
```json
"permissions": ["CAMERA", "RECORD_AUDIO"]
```

#### 3. APK Too Large (>100MB)

- Use APK splitting by ABI
- Remove unused assets
- Optimize images

#### 4. Crashes on Launch

Check logs:
```bash
adb logcat | grep -i crash
```

#### 5. Network Requests Failing

For HTTP (not HTTPS) in development:
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application android:usesCleartextTraffic="true">
```

## Production Checklist

Before releasing to production:

- [ ] Remove all console.log statements
- [ ] Set proper API URL in .env.production
- [ ] Test on multiple devices
- [ ] Verify offline functionality
- [ ] Check battery usage
- [ ] Sign APK with production keystore
- [ ] Version code incremented
- [ ] Backup keystore file

## Distribution Options

### 1. Google Play Store

Requirements:
- Developer account ($25 one-time)
- Signed AAB file (use `buildType: "aab"`)
- App listing details
- Privacy policy

### 2. Direct Distribution

- Host APK on website
- Share via email/messaging
- Use services like AppCenter or Firebase App Distribution

### 3. Enterprise Distribution

For internal company use:
- Use MDM (Mobile Device Management)
- Private app stores
- Internal distribution servers

## Automated CI/CD Build

### GitHub Actions Example

Create `.github/workflows/build-android.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd mobile-app
        npm install

    - name: Setup EAS
      run: |
        npm install -g eas-cli
        eas build:configure

    - name: Build APK
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      run: |
        cd mobile-app
        eas build --platform android --profile production --non-interactive
```

## Version Management

### Updating Version

1. In `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "android": {
      "versionCode": 2   // Increment this for each build
    }
  }
}
```

2. Create git tag:
```bash
git tag v1.0.1
git push origin v1.0.1
```

## Support

For issues or questions:
- Check Expo documentation: https://docs.expo.dev
- EAS Build guide: https://docs.expo.dev/build/introduction
- Create issue on GitHub repository

---

Last updated: January 2025