# Android Development Setup Guide

This guide provides step-by-step instructions for setting up Android development environment for the Driver Monitoring System mobile app.

## 📋 Prerequisites

- Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- Node.js 18+ installed
- Java Development Kit (JDK) 11+
- At least 8GB RAM (16GB recommended)
- 20GB+ free storage space

## 🛠️ Required Software

### 1. Java Development Kit (JDK)

#### Windows/Linux
1. Download OpenJDK 11 from [Adoptium](https://adoptium.net/)
2. Run installer and follow setup wizard
3. Set JAVA_HOME environment variable:
   ```bash
   # Windows (in Command Prompt as Administrator)
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-11.0.x-hotspot"

   # Linux (add to ~/.bashrc)
   export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
   export PATH=$PATH:$JAVA_HOME/bin
   ```

#### macOS
```bash
# Using Homebrew
brew install openjdk@11

# Add to shell profile (~/.zshrc or ~/.bash_profile)
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
export PATH=$JAVA_HOME/bin:$PATH
```

### 2. Android Studio

1. **Download Android Studio**
   - Visit [Android Studio Download Page](https://developer.android.com/studio)
   - Download for your operating system
   - File size: ~1GB

2. **Install Android Studio**
   - Run installer with admin privileges
   - Choose "Standard" installation type
   - Accept license agreements
   - Allow installation of Android SDK components

3. **Initial Setup Wizard**
   - Choose "Custom" setup
   - Select "Android Virtual Device" (AVD)
   - Install latest Android SDK
   - Install Google Play services
   - Create or sign in to Google account (optional)

## 🔧 SDK Configuration

### Android SDK Setup

1. **Open SDK Manager**
   - Start Android Studio
   - Go to "File" → "Settings" (Windows/Linux) or "Preferences" (macOS)
   - Navigate to "System Settings" → "Android SDK"

2. **Install Required SDK Components**

   **SDK Platforms Tab:**
   - ✅ Android 13 (API Level 33)
   - ✅ Android 12 (API Level 31)
   - ✅ Android 11 (API Level 30)
   - ✅ Android 10 (API Level 29)

   **SDK Tools Tab:**
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Google Play services
   - ✅ Intel x86 Emulator Accelerator (HAXM installer)

3. **Note SDK Location**
   - Copy the "Android SDK Location" path
   - Example: `C:\Users\YourName\AppData\Local\Android\Sdk`

### Environment Variables

#### Windows
```bash
# Open Command Prompt as Administrator
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin"
```

#### macOS/Linux
```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk           # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Reload shell configuration:**
```bash
# macOS/Linux
source ~/.bashrc  # or ~/.zshrc
```

### Verify Installation

```bash
# Check Java
java -version
# Expected: openjdk version "11.0.x"

# Check Android tools
adb version
# Expected: Android Debug Bridge version x.x.x

# Check SDK
sdkmanager --list
# Should show installed packages
```

## 📱 Android Virtual Device (AVD)

### Create Virtual Device

1. **Open AVD Manager**
   - Android Studio → "Tools" → "AVD Manager"
   - Click "Create Virtual Device"

2. **Choose Device**
   - Category: "Phone"
   - Recommended: "Pixel 6" or "Pixel 4"
   - Click "Next"

3. **Select System Image**
   - Recommended: "Android 12" (API Level 31)
   - ABI: "x86_64" (for Intel/AMD processors)
   - Target: "Google Play" (includes Google services)
   - Click "Download" if not already downloaded

4. **AVD Configuration**
   - **AVD Name**: "DMS_Test_Device"
   - **Startup orientation**: "Portrait"
   - **Camera**: "Front: Webcam0, Back: Webcam0" (enables camera access)
   - **Network**: "Fast" or "Full"
   - **Advanced Settings**:
     - **RAM**: 2048 MB (minimum)
     - **VM heap**: 256 MB
     - **Internal Storage**: 2048 MB
     - **SD card**: 1024 MB

5. **Finish and Start**
   - Click "Finish"
   - Click "Play" button to start emulator

### Hardware Acceleration (Important)

#### Windows (Intel/AMD)
1. **Enable Hyper-V** (Windows 10 Pro/Enterprise):
   ```bash
   # Run as Administrator
   dism.exe /Online /Enable-Feature:Microsoft-Hyper-V /All
   bcdedit /set hypervisorlaunchtype auto
   ```

2. **Or enable HAXM** (Intel only):
   - Download from [Intel HAXM](https://github.com/intel/haxm/releases)
   - Install with default settings
   - Restart computer

#### macOS
Hardware acceleration is automatically enabled.

#### Linux
```bash
# Install KVM
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# Add user to kvm group
sudo adduser $USER kvm

# Restart and verify
# kvm-ok should show: KVM acceleration can be used
```

## 🔌 Physical Device Setup

### Enable Developer Options

1. **Open Settings** on Android device
2. **About Phone** → Tap "Build number" 7 times
3. **Developer options** will appear in Settings
4. **Enable "Developer options"**

### Enable USB Debugging

1. **Developer options** → **USB Debugging** → Enable
2. **Install via USB** → Enable (Android 8+)
3. **USB Debugging (Security Settings)** → Enable

### Connect Device

1. **Connect via USB** cable to computer
2. **Allow USB Debugging** popup on device → "Always allow" → "OK"
3. **Verify connection**:
   ```bash
   adb devices
   # Should show your device: xxxxxxxx device
   ```

## 📦 Expo CLI Setup

### Install Expo CLI

```bash
# Install globally
npm install -g @expo/cli

# Verify installation
expo --version
```

### Install Expo Go App

1. **Open Google Play Store** on Android device
2. **Search for "Expo Go"**
3. **Install** the Expo Go app
4. **Open** and create account (optional)

## 🚀 Running the App

### Start Development Server

```bash
# Navigate to mobile app directory
cd driver-monitoring-system/mobile-app

# Start Expo development server
npm start
```

### Run on Android Emulator

```bash
# Start specific emulator
emulator -avd DMS_Test_Device

# Or use Expo CLI
npm run android
```

### Run on Physical Device

1. **Ensure device and computer are on same Wi-Fi**
2. **Open Expo Go app**
3. **Scan QR code** from terminal/browser
4. **App will load** on device

## 🔧 Development Tools

### Useful Android Studio Tools

1. **Logcat** - View device logs
   - "View" → "Tool Windows" → "Logcat"
   - Filter by app package name

2. **Device File Explorer**
   - "View" → "Tool Windows" → "Device File Explorer"
   - Browse app files and storage

3. **Layout Inspector**
   - "Tools" → "Layout Inspector"
   - Analyze UI component hierarchy

### ADB Commands

```bash
# View connected devices
adb devices

# Install APK
adb install app.apk

# View app logs
adb logcat

# Clear app data
adb shell pm clear com.dms.drivermonitor

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Record screen
adb shell screenrecord /sdcard/recording.mp4

# Push files to device
adb push file.txt /sdcard/
```

### React Native Debugging

```bash
# Clear Metro cache
npx react-native start --reset-cache

# View React Native logs
npx react-native log-android

# Debug with Flipper
npm install -g flipper
```

## ⚡ Performance Optimization

### Emulator Performance

1. **Allocate more RAM**: 4GB+ in AVD settings
2. **Enable hardware acceleration**: HAXM/Hyper-V
3. **Use x86_64 system images**: Faster than ARM
4. **Close other applications**: Free up system resources

### Build Optimization

```bash
# Clean build cache
cd android
./gradlew clean

# Build release APK
npm run build:android

# Analyze bundle size
npx expo install --fix
```

## 📸 Camera Permissions

### Configure Camera Access

The Driver Monitoring System requires camera access:

1. **Manifest permissions** (automatically added by Expo):
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   ```

2. **Runtime permissions** (handled by app):
   ```javascript
   import { Camera } from 'expo-camera';
   const { status } = await Camera.requestCameraPermissionsAsync();
   ```

3. **Test camera** in emulator:
   - AVD settings → Camera → Front: Webcam0

## ❗ Troubleshooting

### Common Issues

1. **Emulator won't start**
   ```bash
   # Check available system images
   sdkmanager --list | grep system-images

   # Recreate AVD with different API level
   ```

2. **ADB device not found**
   ```bash
   # Kill and restart ADB server
   adb kill-server
   adb start-server

   # Check USB drivers (Windows)
   # Install Google USB Driver via SDK Manager
   ```

3. **Build failures**
   ```bash
   # Clear all caches
   cd android
   ./gradlew clean
   cd ..
   rm -rf node_modules
   npm install
   ```

4. **Metro bundler issues**
   ```bash
   # Clear Metro cache
   npx react-native start --reset-cache

   # Clear npm cache
   npm cache clean --force
   ```

### Performance Issues

1. **Slow emulator**:
   - Increase RAM allocation
   - Enable hardware acceleration
   - Use x86_64 images instead of ARM

2. **App crashes**:
   - Check Logcat for errors
   - Verify permissions granted
   - Test on different API levels

### Network Issues

1. **Cannot connect to development server**:
   - Ensure same Wi-Fi network
   - Check firewall settings
   - Use USB connection: `adb reverse tcp:8081 tcp:8081`

## 📝 Development Checklist

- [ ] Java JDK 11+ installed and configured
- [ ] Android Studio installed with SDK components
- [ ] Environment variables set (ANDROID_HOME, PATH)
- [ ] AVD created and hardware acceleration enabled
- [ ] Physical device configured (optional)
- [ ] Expo CLI installed globally
- [ ] Expo Go app installed on device
- [ ] Camera permissions configured
- [ ] Development server starts successfully
- [ ] App runs on emulator/device

## 🚀 Next Steps

After Android setup:

1. **Test the app**: Run `npm start` in mobile-app directory
2. **Learn debugging**: Explore React Native debugging tools
3. **Camera testing**: Verify camera access works
4. **Build APK**: Prepare for distribution testing

## 📚 Additional Resources

- [Android Developer Documentation](https://developer.android.com/docs)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Expo Documentation](https://docs.expo.dev/)
- [Android Emulator Guide](https://developer.android.com/studio/run/emulator)

---

**Need Help?** Check our [Troubleshooting Guide](../troubleshooting/COMMON_ISSUES.md) for Android-specific issues.