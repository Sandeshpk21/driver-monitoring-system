# iOS Development Setup Guide

This guide provides step-by-step instructions for setting up iOS development environment for the Driver Monitoring System mobile app on macOS.

## 📋 Prerequisites

- **macOS 12.0 (Monterey) or later**
- **Xcode 14.0 or later**
- **Node.js 18+ installed**
- **Apple Developer Account** (free account sufficient for development)
- **iOS device with iOS 13.0+** (optional, for device testing)
- At least 8GB RAM (16GB recommended)
- 50GB+ free storage space (Xcode is large)

## 🛠️ Required Software

### 1. Xcode Installation

#### Option A: Mac App Store (Recommended)
1. **Open Mac App Store**
2. **Search for "Xcode"**
3. **Click "Get" or "Install"** (free download, ~10GB)
4. **Wait for download** (can take 30-60 minutes)
5. **Launch Xcode** and accept license agreements

#### Option B: Apple Developer Portal
1. **Visit** [Apple Developer Downloads](https://developer.apple.com/download/)
2. **Sign in** with Apple ID
3. **Download Xcode** (latest stable version)
4. **Install** from downloaded .xip file

### 2. Command Line Tools

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p
# Expected: /Applications/Xcode.app/Contents/Developer
```

### 3. iOS Simulator

iOS Simulator is included with Xcode, but you may need additional simulators:

1. **Open Xcode**
2. **Window** → **Devices and Simulators**
3. **Simulators tab** → **+** (to add new)
4. **Download** additional iOS versions if needed:
   - iOS 16.0+ (latest)
   - iOS 15.0 (compatibility)
   - iOS 14.0 (older device support)

## 🔧 Development Environment Setup

### CocoaPods Installation

CocoaPods is required for managing iOS dependencies:

```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version

# Setup CocoaPods (first time only)
pod setup
```

### Ruby Version Management (Optional but Recommended)

```bash
# Install rbenv for Ruby version management
brew install rbenv

# Add to shell profile (~/.zshrc)
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Install stable Ruby version
rbenv install 3.1.0
rbenv global 3.1.0

# Verify Ruby version
ruby -v
```

### iOS Development Certificates

#### Automatic Signing (Recommended for Development)

1. **Open Xcode**
2. **Create new project** or **open existing**
3. **Select target** → **Signing & Capabilities**
4. **Check "Automatically manage signing"**
5. **Select your team** (personal team for free accounts)
6. **Xcode will generate certificates automatically**

#### Manual Certificate Setup

1. **Apple Developer Account**
   - Visit [Apple Developer Portal](https://developer.apple.com/)
   - Sign in with Apple ID
   - Enroll in Apple Developer Program (free tier available)

2. **Development Certificate**
   - Keychain Access → Certificate Assistant → Request Certificate
   - Fill in your information
   - Save to disk
   - Upload to Apple Developer Portal

## 📱 iOS Simulator Configuration

### Create iOS Simulators

1. **Open Xcode**
2. **Window** → **Devices and Simulators**
3. **Simulators** tab
4. **Click "+"** to add simulator

**Recommended Simulators:**
- **iPhone 14 Pro** (iOS 16.0+) - Latest features
- **iPhone 12** (iOS 15.0) - Good balance
- **iPhone SE (3rd gen)** (iOS 15.0) - Smaller screen testing
- **iPad Pro 12.9-inch** (iOS 16.0+) - Tablet testing

### Simulator Configuration

For each simulator, configure:

1. **Device Settings**:
   - **Privacy & Security** → **Camera** → Allow camera access
   - **Privacy & Security** → **Location Services** → Enable
   - **Settings** → **Developer** (if available) → Enable

2. **Hardware Menu** (when simulator is running):
   - **Device** → **Camera** → Enable camera
   - **Device** → **Location** → Set custom location

### Hardware Requirements

For optimal iOS Simulator performance:
- **Rosetta 2** (Apple Silicon Macs running Intel simulators)
  ```bash
  /usr/sbin/softwareupdate --install-rosetta --agree-to-license
  ```

## 📦 Expo CLI Setup for iOS

### Install Expo CLI

```bash
# Install globally
npm install -g @expo/cli

# Install EAS CLI (for builds)
npm install -g @expo/eas-cli

# Verify installations
expo --version
eas --version
```

### Expo Go App (Physical Device Testing)

1. **Download Expo Go** from App Store
2. **Open app** and create account (optional)
3. **Enable camera and location permissions**

### iOS Development Build Setup

For advanced features, create a development build:

```bash
# Navigate to mobile app directory
cd driver-monitoring-system/mobile-app

# Configure EAS
eas build:configure

# Create iOS development build
eas build --platform ios --profile development
```

## 🚀 Running the App

### Start Development Server

```bash
# Navigate to mobile app directory
cd driver-monitoring-system/mobile-app

# Start Expo development server
npm start
```

### Run on iOS Simulator

```bash
# Press 'i' in Expo CLI terminal
# Or use specific command
npm run ios

# Or specify simulator
expo run:ios --simulator "iPhone 14 Pro"
```

### Run on Physical iOS Device

#### Method 1: Expo Go (Simplest)
1. **Connect device and computer to same Wi-Fi**
2. **Open Expo Go app**
3. **Scan QR code** from terminal/browser
4. **App loads on device**

#### Method 2: Development Build
```bash
# Create and install development build
eas build --platform ios --profile development
eas build:run -p ios
```

#### Method 3: Xcode (Advanced)
1. **Open iOS project in Xcode**:
   ```bash
   cd driver-monitoring-system/mobile-app/ios
   open DriverMonitor.xcworkspace
   ```
2. **Connect iOS device via USB**
3. **Select device as target**
4. **Click "Run" button**

## 🔧 Development Tools

### Xcode Developer Tools

1. **Interface Builder**
   - Visual UI design and constraint editing
   - Storyboard and XIB file editing

2. **Instruments**
   - Performance profiling
   - Memory leak detection
   - CPU usage analysis

3. **Console**
   - View device logs and crash reports
   - Filter by app bundle identifier

4. **Device Organizer**
   - Manage connected devices
   - View crash logs and diagnostics

### Debugging Tools

#### Xcode Debugger
```bash
# Set breakpoints in Xcode
# View variables and call stack
# Step through code execution
```

#### Safari Web Inspector (for React Native)
1. **Enable** → Safari → Develop → [Device Name] → Automatically Show Web Inspector
2. **Debug** JavaScript code in Safari DevTools

#### Flipper (Facebook's Debugging Platform)
```bash
# Install Flipper
brew install --cask flipper

# Launch and connect to app
flipper
```

### Useful Commands

```bash
# List available simulators
xcrun simctl list devices

# Launch specific simulator
xcrun simctl boot "iPhone 14 Pro"

# Install app on simulator
xcrun simctl install booted /path/to/app.app

# Take simulator screenshot
xcrun simctl io booted screenshot screenshot.png

# Record simulator video
xcrun simctl io booted recordVideo video.mov
```

## 📸 Camera Configuration for iOS

### Camera Permissions

The app requires camera access for driver monitoring:

1. **Info.plist Configuration** (handled by Expo):
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>This app needs access to camera for driver monitoring and safety detection.</string>
   ```

2. **Runtime Permission Request**:
   ```javascript
   import { Camera } from 'expo-camera';
   const { status } = await Camera.requestCameraPermissionsAsync();
   ```

### Simulator Camera Testing

1. **Simulator Menu** → **Device** → **Camera**
2. **Choose camera option**:
   - **Front Camera**: Test front-facing detection
   - **Back Camera**: Test rear camera functionality
   - **Photo Library**: Use test images

## ⚡ Performance Optimization

### Build Performance

1. **Derived Data Cleanup**:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

2. **Simulator Reset**:
   ```bash
   xcrun simctl erase all
   ```

3. **Pod Cache Clear**:
   ```bash
   cd mobile-app/ios
   rm -rf Pods/
   pod install --repo-update
   ```

### Runtime Performance

1. **Release Build Testing**:
   ```bash
   # Build for release
   expo build:ios --release-channel production
   ```

2. **Bundle Size Analysis**:
   ```bash
   # Analyze bundle
   expo export --dev false --clear
   ```

## 🔐 Code Signing and Certificates

### Development Certificate Issues

1. **Certificate Expired**:
   - Xcode → Preferences → Accounts → Download Manual Profiles
   - Or recreate certificate in Apple Developer Portal

2. **Provisioning Profile Issues**:
   ```bash
   # Clean profiles
   rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*
   # Re-download in Xcode
   ```

3. **Keychain Issues**:
   - Open Keychain Access
   - Delete expired certificates
   - Restart Xcode

### App Store Connect (Future Distribution)

1. **App Store Connect Account**
   - Create app entry
   - Configure app information
   - Upload build via Xcode or Transporter

2. **TestFlight Beta Testing**
   - Upload build to App Store Connect
   - Add beta testers
   - Distribute test builds

## ❗ Troubleshooting

### Common Issues

1. **Xcode won't start**:
   ```bash
   # Reset Xcode
   sudo xcode-select --reset
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

2. **CocoaPods installation fails**:
   ```bash
   # Clean and reinstall
   cd mobile-app/ios
   rm -rf Pods/ Podfile.lock
   pod deintegrate
   pod install
   ```

3. **Simulator crashes**:
   ```bash
   # Reset simulator
   xcrun simctl shutdown all
   xcrun simctl erase all
   ```

4. **Build errors**:
   ```bash
   # Clean build folder
   # Xcode: Product → Clean Build Folder
   # Or via command line:
   xcodebuild clean -workspace ios/DriverMonitor.xcworkspace -scheme DriverMonitor
   ```

### Performance Issues

1. **Slow simulator**:
   - Close other applications
   - Increase macOS storage space
   - Restart simulator

2. **App crashes on device**:
   - Check device logs in Xcode Console
   - Verify proper code signing
   - Test on different iOS versions

### Network and Connectivity

1. **Cannot connect to development server**:
   - Ensure same Wi-Fi network
   - Check macOS firewall settings
   - Try USB connection via Xcode

2. **Expo Go connection issues**:
   - Clear Expo Go app cache
   - Restart development server
   - Try different network

## 📝 Development Checklist

- [ ] macOS 12.0+ with sufficient storage
- [ ] Xcode 14.0+ installed from Mac App Store
- [ ] Command Line Tools installed
- [ ] Apple Developer Account set up
- [ ] iOS Simulators downloaded and configured
- [ ] CocoaPods installed and working
- [ ] Expo CLI and EAS CLI installed
- [ ] Camera permissions configured
- [ ] Development server connects to simulator
- [ ] App runs successfully on simulator
- [ ] Physical device testing (optional)

## 🚀 Next Steps

After iOS setup:

1. **Test the app**: Run `npm start` and test on simulator
2. **Device testing**: Test on physical iOS device
3. **Camera functionality**: Verify camera access works
4. **Performance testing**: Profile app performance
5. **Prepare for distribution**: Set up App Store Connect

## 📚 Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [iOS Development Guide](https://developer.apple.com/ios/)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)
- [Expo iOS Development](https://docs.expo.dev/workflow/ios-simulator/)

---

**Need Help?** Check our [Troubleshooting Guide](../troubleshooting/COMMON_ISSUES.md) for iOS-specific issues.