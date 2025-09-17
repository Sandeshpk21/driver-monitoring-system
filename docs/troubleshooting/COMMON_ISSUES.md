# Common Issues and Solutions

This guide provides solutions to frequently encountered problems when setting up and running the Driver Monitoring System.

## 🔧 Installation Issues

### Node.js and NPM Problems

#### Issue: "npm install" fails with permission errors (Linux/macOS)
```bash
# Solution 1: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Solution 2: Use Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Issue: "Package not found" or version conflicts
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For persistent issues, use exact versions
npm install --save-exact
```

#### Issue: "Module not found" errors
```bash
# Check if packages are installed
npm list --depth=0

# Reinstall missing packages
npm install missing-package-name

# For TypeScript path resolution issues
npm install --save-dev @types/node
```

### Dependency Installation Failures

#### Issue: Python or build tools missing (Windows)
```bash
# Install Windows Build Tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2019
```

#### Issue: Expo CLI installation fails
```bash
# Uninstall old expo-cli first
npm uninstall -g expo-cli

# Install new Expo CLI
npm install -g @expo/cli

# Verify installation
expo --version
```

#### Issue: React Native vision camera compilation fails
```bash
# iOS: Update CocoaPods
cd mobile-app/ios
rm -rf Pods/ Podfile.lock
pod install --repo-update

# Android: Clean and rebuild
cd mobile-app/android
./gradlew clean
cd ..
npm run android
```

## 🗄️ Database Issues

### PostgreSQL Connection Problems

#### Issue: "Connection refused" or "could not connect"
```bash
# Check if PostgreSQL is running
# Linux/macOS
sudo systemctl status postgresql
brew services list | grep postgresql

# Windows - check services
services.msc # Look for PostgreSQL service

# Start PostgreSQL if stopped
sudo systemctl start postgresql  # Linux
brew services start postgresql@14  # macOS
# Windows: Start from Services panel
```

#### Issue: "Authentication failed" for user
```sql
-- Check if user exists
\du  -- in psql

-- Reset password
ALTER USER dms_user WITH PASSWORD 'new_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE driver_monitoring TO dms_user;
```

#### Issue: "Database does not exist"
```sql
-- Create database
CREATE DATABASE driver_monitoring
    WITH
    OWNER = dms_user
    ENCODING = 'UTF8';

-- Verify creation
\l  -- list databases
```

#### Issue: Permission denied errors
```sql
-- Connect as superuser
psql -U postgres

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO dms_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO dms_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO dms_user;
```

### Database Schema Issues

#### Issue: Tables not created after running init.sql
```bash
# Verify file exists
ls -la backend/sql/init.sql

# Run with verbose output
psql -U dms_user -d driver_monitoring -f backend/sql/init.sql -v ON_ERROR_STOP=1

# Check for syntax errors
cat backend/sql/init.sql | head -50
```

#### Issue: UUID extension not available
```sql
-- Install uuid-ossp extension (requires superuser)
psql -U postgres -d driver_monitoring
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### pgAdmin Issues

#### Issue: pgAdmin won't connect to PostgreSQL
1. **Check connection settings**:
   - Host: `localhost` (not `127.0.0.1`)
   - Port: `5432`
   - Username: `postgres` (for initial setup)

2. **Reset pgAdmin configuration**:
   ```bash
   # Delete pgAdmin config (closes pgAdmin first)
   rm -rf ~/.pgadmin  # Linux/macOS
   # Windows: Delete %APPDATA%\pgadmin
   ```

3. **Check PostgreSQL configuration**:
   ```bash
   # Find config file
   sudo -u postgres psql -c "SHOW config_file;"

   # Check listen_addresses
   sudo -u postgres psql -c "SHOW listen_addresses;"
   ```

## 🖥️ Backend API Issues

### Server Won't Start

#### Issue: "Port already in use"
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows

# Or use utility
npx kill-port 3001
```

#### Issue: Environment variables not loaded
```bash
# Check .env file exists
ls -la backend/.env

# Verify file format (no spaces around =)
cat backend/.env

# Test variable loading
cd backend
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET);"
```

#### Issue: Database connection fails on startup
```bash
# Test database connection manually
psql -U dms_user -d driver_monitoring -h localhost

# Check environment variables
cat backend/.env | grep DB_

# Verify database is running
pg_isready -h localhost -p 5432
```

### API Authentication Issues

#### Issue: JWT token errors
```javascript
// Debug JWT in backend
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);

// Test token generation
const jwt = require('jsonwebtoken');
const token = jwt.sign({test: true}, process.env.JWT_SECRET);
console.log('Generated token:', token);
```

#### Issue: CORS errors from frontend
```javascript
// Update CORS configuration in backend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Add your domain
  ],
  credentials: true,
}));
```

### API Request Failures

#### Issue: 500 Internal Server Error
```bash
# Check backend logs
cd backend
npm run dev  # Look for error messages

# Enable debug logging
echo "LOG_LEVEL=debug" >> .env
```

#### Issue: Database query errors
```javascript
// Add query logging in database.ts
console.log('Executing query:', text, params);

// Check database connection pool
console.log('DB config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
});
```

## 🌐 Web Dashboard Issues

### Next.js Build and Runtime Issues

#### Issue: "Module not found" in Next.js
```javascript
// Check tsconfig.json paths configuration
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Ensure imports use correct paths
import { Component } from '../src/components/Component';
// Should be:
import { Component } from '@/components/Component';
```

#### Issue: Environment variables not available
```bash
# Next.js public variables must start with NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=http://localhost:3001

# Restart development server after adding variables
npm run dev
```

#### Issue: Hydration errors
```javascript
// Check for differences between server and client rendering
// Common cause: Date/time formatting, random values, localStorage access

// Fix: Use useEffect for client-only code
useEffect(() => {
  // Client-only code here
}, []);
```

#### Issue: API calls failing from dashboard
```bash
# Check network tab in browser DevTools
# Verify API URL is correct

# Test API endpoint directly
curl http://localhost:3001/api/v1/auth/me

# Check CORS headers
curl -I -X OPTIONS http://localhost:3001/api/v1/auth/me
```

### Authentication Issues

#### Issue: Login fails silently
```javascript
// Add debugging to login process
console.log('Login attempt:', credentials);
console.log('API response:', response);
console.log('Token received:', response.data?.token);

// Check token storage
console.log('Stored token:', Cookies.get('auth_token'));
```

#### Issue: Redirects not working
```javascript
// Check Next.js router usage
import { useRouter } from 'next/router';

const router = useRouter();
// Make sure to use router.push(), not window.location
await router.push('/dashboard');
```

### Styling Issues

#### Issue: Tailwind CSS not working
```bash
# Check PostCSS configuration
cat postcss.config.js

# Verify Tailwind is included in CSS
# src/styles/globals.css should have:
# @tailwind base;
# @tailwind components;
# @tailwind utilities;

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### Issue: Components not styled correctly
```bash
# Check Tailwind config includes all files
# tailwind.config.js content array should include:
content: [
  './pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/**/*.{js,ts,jsx,tsx,mdx}',
]
```

## 📱 Mobile App Issues

### Expo Development Issues

#### Issue: Expo CLI commands not working
```bash
# Uninstall old CLI and install new
npm uninstall -g expo-cli @expo/cli
npm install -g @expo/cli

# Clear npm cache
npm cache clean --force

# Verify installation
expo --version
```

#### Issue: Metro bundler fails to start
```bash
# Clear Metro cache
npx expo start --clear

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Kill existing Metro processes
npx kill-port 8081

# Restart with fresh cache
npx expo start --clear
```

#### Issue: "Unable to resolve module" errors
```bash
# Clear all caches
rm -rf node_modules
npm cache clean --force
npm install

# Clear Expo cache
npx expo install --fix

# Restart development server
npx expo start --clear
```

### Device Connection Issues

#### Issue: Expo Go can't connect to development server
```bash
# Try different connection methods
expo start --tunnel  # Use tunneling
expo start --lan     # Use LAN IP
expo start --localhost  # Force localhost

# Check firewall settings
# Make sure port 8081 is not blocked

# For Android, use ADB port forwarding
adb reverse tcp:8081 tcp:8081
```

#### Issue: Android emulator not detected
```bash
# Check if emulator is running
adb devices

# Start emulator manually
emulator -avd DMS_Test_Device

# Check Android SDK path
echo $ANDROID_HOME

# Restart ADB
adb kill-server
adb start-server
```

#### Issue: iOS Simulator not opening
```bash
# List available simulators
xcrun simctl list devices

# Start specific simulator
xcrun simctl boot "iPhone 14 Pro"

# Reset simulator if issues persist
xcrun simctl shutdown all
xcrun simctl erase all
```

### Camera and Permissions Issues

#### Issue: Camera permission denied
```javascript
// Check permission request implementation
import { Camera } from 'expo-camera';

const requestPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  console.log('Camera permission status:', status);
  return status === 'granted';
};

// For iOS simulator, enable camera in device settings
// Device > Camera > Front Camera: Select option
```

#### Issue: Camera not working on Android emulator
1. **Enable camera in AVD settings**:
   - Android Studio > AVD Manager
   - Edit AVD > Advanced Settings
   - Front Camera: Webcam0
   - Back Camera: Webcam0

2. **Grant permissions manually**:
   - Open app in emulator
   - Go to Settings > Apps > Your App > Permissions
   - Enable Camera permission

#### Issue: Location services not working
```javascript
// Check location permission implementation
import * as Location from 'expo-location';

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  console.log('Location permission status:', status);
  return status === 'granted';
};

// Enable location in simulator
// Device > Location > Custom Location
```

### Build Issues

#### Issue: EAS Build failures
```bash
# Clear build cache
eas build --clear-cache

# Check build logs
eas build:list
eas build:view [build-id]

# Update EAS CLI
npm update -g @expo/eas-cli

# Verify project configuration
eas build:configure
```

#### Issue: iOS build fails with provisioning profile errors
```bash
# Clear certificates and profiles
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*

# Re-download in Xcode
# Xcode > Preferences > Accounts > Download Manual Profiles

# Or use automatic signing
# In Xcode: Target > Signing & Capabilities > Automatically manage signing
```

## 🔄 Network and Connectivity Issues

### API Connection Problems

#### Issue: Network request failed
```javascript
// Add request/response interceptors for debugging
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.log('Error:', error.response || error);
    return Promise.reject(error);
  }
);
```

#### Issue: CORS preflight failures
```bash
# Add OPTIONS method to backend routes
app.options('*', cors()); // Enable preflight for all routes

# Or configure specific CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

#### Issue: Timeout errors
```javascript
// Increase timeout in API client
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds instead of default 10
});

// Add retry logic
const retryRequest = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};
```

### Sync Issues

#### Issue: Offline data not syncing
```javascript
// Debug sync status
console.log('Network status:', await NetInfo.fetch());
console.log('Pending sync items:', await db.getUnsyncedSessions());

// Test manual sync
try {
  const result = await syncService.forcSync();
  console.log('Sync result:', result);
} catch (error) {
  console.log('Sync error:', error);
}
```

## 🚀 Performance Issues

### Application Performance

#### Issue: Slow startup times
```bash
# Analyze bundle size
# Web Dashboard
npm run build
npx webpack-bundle-analyzer .next/static/chunks/*.js

# Mobile App
expo export --dev false --clear
```

#### Issue: Memory leaks
```javascript
// Check for proper cleanup
useEffect(() => {
  const subscription = someService.subscribe();

  return () => {
    subscription.unsubscribe(); // Important: cleanup
  };
}, []);

// Use memory profiling tools
// Chrome DevTools > Memory tab
// Xcode Instruments for iOS
```

#### Issue: Database query performance
```sql
-- Check query execution plans
EXPLAIN ANALYZE SELECT * FROM sessions WHERE driver_id = 'uuid';

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_sessions_driver_created
ON sessions(driver_id, created_at);

-- Check database statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

## 📊 Monitoring and Debugging

### Logging Issues

#### Issue: Logs not appearing
```bash
# Backend: Check log level
echo "LOG_LEVEL=debug" >> backend/.env

# Check log files
ls -la backend/logs/

# For mobile app, use Flipper or React Native Debugger
npm install -g react-native-debugger
```

#### Issue: Console errors not helpful
```javascript
// Add better error handling
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', {
    message: error.message,
    stack: error.stack,
    context: { userId, sessionId },
  });

  // Send to error tracking service
  // Sentry.captureException(error, { context });
}
```

## 🆘 Getting Additional Help

### Diagnostic Commands

Run these commands to gather system information:

```bash
#!/bin/bash
echo "=== System Information ==="
node --version
npm --version
psql --version

echo "=== Environment Check ==="
ls -la */.env*

echo "=== Service Status ==="
curl -I http://localhost:3001/health
curl -I http://localhost:3000

echo "=== Database Status ==="
pg_isready -h localhost -p 5432

echo "=== Port Usage ==="
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

### Log Collection

```bash
# Collect logs for troubleshooting
mkdir -p debug-logs
cd debug-logs

# Backend logs
cp ../backend/logs/* . 2>/dev/null || echo "No backend logs"

# Development server logs
npm run dev > dev-server.log 2>&1 &
sleep 10
kill %1

# System information
uname -a > system-info.txt
node --version > node-version.txt
npm list --depth=0 > npm-packages.txt
```

### When to Seek Help

1. **Check this troubleshooting guide first**
2. **Review relevant component documentation**
3. **Search existing issues** in project repository
4. **Collect diagnostic information** using scripts above
5. **Create detailed issue report** with:
   - System information (OS, Node.js version, etc.)
   - Exact error messages and stack traces
   - Steps to reproduce the problem
   - Relevant log files
   - Configuration files (without secrets)

---

**Still having issues?** Create an issue in the project repository with detailed information about your problem.