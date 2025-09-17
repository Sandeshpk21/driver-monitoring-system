# Expo Development Guide

This guide covers Expo CLI usage, development workflow, and deployment processes for the Driver Monitoring System mobile app.

## 📋 Overview

Expo is a platform that simplifies React Native development by providing:
- **Managed workflow** with pre-configured build tools
- **Expo Go app** for easy device testing
- **EAS Build** for cloud-based app builds
- **Over-the-air updates** for rapid iteration

## 🛠️ Expo CLI Installation

### Install Expo CLI

```bash
# Install globally
npm install -g @expo/cli

# Install EAS CLI for builds and submissions
npm install -g @expo/eas-cli

# Verify installations
expo --version
eas --version
```

### Login to Expo Account

```bash
# Create account or login
expo login

# Check current user
expo whoami
```

## 🚀 Development Workflow

### Starting Development Server

```bash
# Navigate to mobile app directory
cd driver-monitoring-system/mobile-app

# Start Expo development server
expo start

# Or with specific options
expo start --clear  # Clear cache
expo start --tunnel  # Use tunneling for network issues
expo start --localhost  # Local development only
```

### Development Server Options

When `expo start` runs, you'll see options:

- **Press `a`** → Open Android emulator/device
- **Press `i`** → Open iOS simulator
- **Press `w`** → Open web browser (if supported)
- **Press `r`** → Reload app
- **Press `d`** → Open developer menu
- **Press `j`** → Open debugger
- **Press `c`** → Clear cache and restart

## 📱 Device Testing

### Expo Go App

#### Installation
- **Android**: Download from Google Play Store
- **iOS**: Download from App Store

#### Usage
1. **Ensure same Wi-Fi network** as development computer
2. **Open Expo Go app**
3. **Scan QR code** from terminal or browser
4. **App loads automatically**

### Development Builds

For advanced features not available in Expo Go:

```bash
# Configure development build
eas build:configure

# Create development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Install on device
eas build:run -p ios
eas build:run -p android
```

## 🔧 Configuration Files

### app.json / app.config.js

Main Expo configuration file:

```json
{
  "expo": {
    "name": "Driver Monitor",
    "slug": "driver-monitoring-system",
    "version": "1.0.0",
    "orientation": "landscape",
    "platforms": ["ios", "android"],
    "userInterfaceStyle": "light",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

### eas.json

EAS Build and Submit configuration:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### metro.config.js

Metro bundler configuration:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver configurations
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@services': './src/services',
  '@utils': './src/utils',
};

module.exports = config;
```

## 📸 Camera Integration

### Expo Camera Setup

```bash
# Install camera package
expo install expo-camera

# Install image picker (optional)
expo install expo-image-picker
```

### Camera Permissions

```javascript
import { Camera } from 'expo-camera';

const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera permission is required for driver monitoring');
    return false;
  }
  return true;
};
```

### Basic Camera Usage

```javascript
import { Camera, CameraType } from 'expo-camera';
import { useState, useRef } from 'react';

function CameraScreen() {
  const [type, setType] = useState(CameraType.front);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef();

  if (!permission) {
    return <View />; // Loading
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>Camera access is required</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <Camera
      style={styles.camera}
      type={type}
      ref={cameraRef}
      onCameraReady={() => console.log('Camera ready')}
    >
      {/* Camera overlay UI */}
    </Camera>
  );
}
```

## 🗄️ Local Storage

### Expo SQLite

```bash
# Install SQLite
expo install expo-sqlite
```

```javascript
import * as SQLite from 'expo-sqlite';

// Open database
const db = SQLite.openDatabase('driver_monitoring.db');

// Create tables
db.transaction(tx => {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT);'
  );
});
```

### AsyncStorage

```bash
# Install AsyncStorage
expo install @react-native-async-storage/async-storage
```

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('user_token', token);

// Retrieve data
const token = await AsyncStorage.getItem('user_token');
```

## 🌐 Network and API Integration

### Network Information

```bash
# Install NetInfo
expo install @react-native-community/netinfo
```

```javascript
import NetInfo from '@react-native-community/netinfo';

// Monitor network status
const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected:', state.isConnected);
});
```

### HTTP Requests

```javascript
import axios from 'axios';

// Configure base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Make requests
const response = await apiClient.get('/api/v1/sessions');
```

## 📍 Location Services

### Install Location Package

```bash
expo install expo-location
```

### Request Location Permission

```javascript
import * as Location from 'expo-location';

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Location permission is required for trip tracking');
    return false;
  }
  return true;
};

// Get current location
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});
```

## 🔨 Building and Distribution

### Development Builds

```bash
# Create development build for testing
eas build --platform ios --profile development
eas build --platform android --profile development

# Install on connected device
eas build:run -p ios --latest
eas build:run -p android --latest
```

### Preview Builds

```bash
# Create internal distribution build
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Share with internal testers
```

### Production Builds

```bash
# Create App Store / Play Store builds
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Over-the-Air Updates

```bash
# Publish update to existing app
eas update

# Publish to specific channel
eas update --channel production
eas update --channel staging
```

## 🧪 Testing and Debugging

### Expo DevTools

1. **Start development server**: `expo start`
2. **Open DevTools**: Press `d` in terminal
3. **Available tools**:
   - Element inspector
   - Performance monitor
   - Network requests
   - Console logs

### Debug with Chrome DevTools

1. **Start debug mode**: Press `j` in terminal
2. **Chrome opens** with React Native debugger
3. **Use Chrome DevTools** for debugging JavaScript

### Performance Profiling

```bash
# Enable performance monitoring
expo start --profile

# Use Flipper for advanced profiling
npm install -g flipper
```

### Testing on Different Devices

```bash
# Test on specific iOS simulator
expo run:ios --simulator "iPhone 14 Pro"

# Test on connected Android device
expo run:android --device
```

## 🔧 Common Development Tasks

### Clear Cache

```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force

# Clear Metro cache
npx react-native start --reset-cache
```

### Update Dependencies

```bash
# Check for Expo SDK updates
expo install --fix

# Update to latest Expo SDK
expo upgrade
```

### Environment Variables

Create `.env` file in project root:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

Access in code:

```javascript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### Custom Splash Screen

```javascript
// app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

```bash
# Install splash screen package
expo install expo-splash-screen
```

```javascript
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

// Hide splash screen when ready
SplashScreen.hideAsync();
```

## 📦 Asset Management

### Image Assets

```javascript
// Local images
import logoImage from '../assets/logo.png';
<Image source={logoImage} />

// Remote images
<Image source={{ uri: 'https://example.com/image.png' }} />
```

### Font Loading

```bash
# Install font package
expo install expo-font
```

```javascript
import * as Font from 'expo-font';

const loadFonts = async () => {
  await Font.loadAsync({
    'custom-font': require('./assets/fonts/CustomFont.ttf'),
  });
};
```

## ❗ Troubleshooting

### Common Issues

1. **Metro bundler not starting**:
   ```bash
   # Kill existing Metro processes
   npx kill-port 8081
   expo start --clear
   ```

2. **Expo Go connection issues**:
   ```bash
   # Try tunnel mode
   expo start --tunnel

   # Or use local IP
   expo start --lan
   ```

3. **Build failures**:
   ```bash
   # Clear EAS build cache
   eas build --clear-cache

   # Check build logs
   eas build:list
   ```

4. **Development build crashes**:
   ```bash
   # Reinstall development build
   eas build:run -p ios --latest
   ```

### Performance Issues

1. **Slow reload times**:
   - Enable Fast Refresh in developer menu
   - Use development build instead of Expo Go
   - Clear Metro cache regularly

2. **Large bundle size**:
   ```bash
   # Analyze bundle
   expo export --dev false --clear

   # Use bundle analyzer
   npx react-native-bundle-visualizer
   ```

### Platform-Specific Issues

1. **iOS Simulator not opening**:
   ```bash
   # Reset iOS simulator
   xcrun simctl shutdown all
   xcrun simctl erase all
   ```

2. **Android emulator issues**:
   ```bash
   # Check Android setup
   adb devices

   # Restart ADB server
   adb kill-server && adb start-server
   ```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] App tested on multiple devices/simulators
- [ ] All features working offline and online
- [ ] Camera permissions working correctly
- [ ] Location services functioning
- [ ] Network error handling implemented
- [ ] App icons and splash screens configured
- [ ] Environment variables set for production

### App Store Preparation

- [ ] App Store Connect account set up
- [ ] Bundle identifier configured
- [ ] App metadata prepared (description, keywords, screenshots)
- [ ] Privacy policy created
- [ ] App Store review guidelines compliance verified

### Play Store Preparation

- [ ] Google Play Console account set up
- [ ] App signing certificate configured
- [ ] Store listing prepared
- [ ] Content rating completed
- [ ] Target audience specified

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

**Need Help?** Check our [Troubleshooting Guide](../troubleshooting/COMMON_ISSUES.md) for Expo-specific issues.