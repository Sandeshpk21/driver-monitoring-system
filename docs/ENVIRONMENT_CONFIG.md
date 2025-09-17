# Environment Configuration Guide

This guide provides comprehensive instructions for configuring environment variables and settings across all components of the Driver Monitoring System.

## 📋 Overview

The system uses environment variables to configure:
- **Database connections**
- **API endpoints and ports**
- **Authentication secrets**
- **External service integrations**
- **Development vs production settings**

## 🏗️ Environment Files Structure

```
driver-monitoring-system/
├── backend/.env                    # Backend API configuration
├── web-dashboard/.env.local        # Web dashboard configuration
├── mobile-app/.env                # Mobile app configuration
├── .env.example                   # Root level example (optional)
└── docker-compose.override.yml    # Docker environment overrides
```

## 🔧 Backend Configuration

### File: `backend/.env`

```bash
# Copy from example
cp backend/.env.example backend/.env
```

### Required Variables

```env
#====================
# SERVER CONFIGURATION
#====================
NODE_ENV=development
PORT=3001

#====================
# DATABASE CONFIGURATION
#====================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=driver_monitoring
DB_USER=dms_user
DB_PASSWORD=dms_password

# Optional: Database connection pool settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000

#====================
# JWT AUTHENTICATION
#====================
# IMPORTANT: Generate a secure random string for production
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_at_least_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

#====================
# API CONFIGURATION
#====================
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
# CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://yourdomain.com

#====================
# FILE UPLOAD
#====================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

#====================
# RATE LIMITING
#====================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

#====================
# LOGGING
#====================
LOG_LEVEL=debug

#====================
# EXTERNAL SERVICES (Optional)
#====================
# Email service (for notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Redis (for session storage, optional)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# Monitoring and Analytics
# SENTRY_DSN=https://your-sentry-dsn
```

### Environment-Specific Settings

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=very-secure-production-secret-here
```

#### Testing
```env
NODE_ENV=test
DB_NAME=driver_monitoring_test
LOG_LEVEL=error
JWT_SECRET=test-secret-key
```

## 🌐 Web Dashboard Configuration

### File: `web-dashboard/.env.local`

```bash
# Copy from example
cp web-dashboard/.env.example web-dashboard/.env.local
```

### Required Variables

```env
#====================
# API CONFIGURATION
#====================
NEXT_PUBLIC_API_URL=http://localhost:3001

#====================
# APPLICATION SETTINGS
#====================
NEXT_PUBLIC_APP_NAME=Driver Monitoring System
NEXT_PUBLIC_APP_VERSION=1.0.0

#====================
# AUTHENTICATION
#====================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

#====================
# ANALYTICS (Optional)
#====================
# Google Analytics
# NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX

# Sentry Error Tracking
# NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

#====================
# FEATURE FLAGS
#====================
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Environment-Specific Settings

#### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEBUG=true
```

#### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXTAUTH_URL=https://dashboard.yourdomain.com
```

#### Staging
```env
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## 📱 Mobile App Configuration

### File: `mobile-app/.env`

```bash
# Copy from example
cp mobile-app/.env.example mobile-app/.env
```

### Required Variables

```env
#====================
# API CONFIGURATION
#====================
EXPO_PUBLIC_API_URL=http://localhost:3001

#====================
# APPLICATION SETTINGS
#====================
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1

#====================
# DETECTION SETTINGS
#====================
EXPO_PUBLIC_EAR_THRESHOLD=0.140
EXPO_PUBLIC_MAR_THRESHOLD=0.6
EXPO_PUBLIC_GAZE_THRESHOLD=0.05

#====================
# DEVICE SETTINGS
#====================
EXPO_PUBLIC_CAMERA_QUALITY=high
EXPO_PUBLIC_SYNC_INTERVAL_MS=30000

#====================
# EXTERNAL SERVICES (Optional)
#====================
# Sentry Error Tracking
# EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Analytics
# EXPO_PUBLIC_ANALYTICS_ID=your-analytics-id

#====================
# DEVELOPMENT SETTINGS
#====================
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Platform-Specific Variables

#### iOS Configuration
```env
# iOS-specific settings in app.json
# These are not environment variables but configuration options
IOS_BUNDLE_IDENTIFIER=com.dms.drivermonitor
IOS_VERSION=1.0.0
IOS_BUILD_NUMBER=1
```

#### Android Configuration
```env
# Android-specific settings in app.json
ANDROID_PACKAGE=com.dms.drivermonitor
ANDROID_VERSION_CODE=1
```

## 🐳 Docker Configuration

### File: `docker-compose.override.yml`

Create for local development overrides:

```yaml
version: '3.8'

services:
  postgres:
    environment:
      - POSTGRES_DB=driver_monitoring
      - POSTGRES_USER=dms_user
      - POSTGRES_PASSWORD=dms_password
    ports:
      - "5432:5432"

  backend:
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - JWT_SECRET=development-jwt-secret-key-not-for-production
      - LOG_LEVEL=debug
    volumes:
      - ./backend:/app
      - /app/node_modules

  web-dashboard:
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
      - NODE_ENV=development
    volumes:
      - ./web-dashboard:/app
      - /app/node_modules
```

### Production Docker Environment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

  backend:
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=warn

  web-dashboard:
    environment:
      - NEXT_PUBLIC_API_URL=${PUBLIC_API_URL}
      - NODE_ENV=production
```

## 🔐 Security Best Practices

### Generating Secure Keys

#### JWT Secret
```bash
# Generate random JWT secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -base64 32

# Or online generator (development only)
# Use: https://www.uuidgenerator.net/
```

#### Database Passwords
```bash
# Generate secure database password
openssl rand -base64 24
```

### Environment Variable Security

1. **Never commit `.env` files** to version control
2. **Use different secrets** for different environments
3. **Rotate secrets regularly** in production
4. **Use environment variable management** services in production

### Production Security Checklist

- [ ] Generate unique JWT secret for production
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Use environment variable management service
- [ ] Implement secret rotation strategy
- [ ] Monitor for exposed credentials
- [ ] Use HTTPS for all API endpoints

## 🔄 Environment Variable Loading

### Backend (Node.js)

```javascript
// src/utils/config.ts
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};
```

### Web Dashboard (Next.js)

```javascript
// next.config.js
module.exports = {
  env: {
    CUSTOM_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Runtime configuration
  serverRuntimeConfig: {
    // Only available on server-side
    privateKey: process.env.PRIVATE_KEY,
  },
  publicRuntimeConfig: {
    // Available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

### Mobile App (Expo)

```javascript
// src/config/environment.ts
interface Environment {
  API_URL: string;
  APP_VERSION: string;
  DEBUG_ENABLED: boolean;
}

const getEnvironment = (): Environment => {
  return {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
    APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    DEBUG_ENABLED: process.env.EXPO_PUBLIC_ENABLE_DEBUG === 'true',
  };
};

export const env = getEnvironment();
```

## 🧪 Testing Configuration

### Test Environment Variables

Create separate environment files for testing:

#### `backend/.env.test`
```env
NODE_ENV=test
DB_NAME=driver_monitoring_test
JWT_SECRET=test-jwt-secret-not-for-production
LOG_LEVEL=error
```

#### `web-dashboard/.env.test.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Running Tests with Environment

```bash
# Backend tests
cd backend
NODE_ENV=test npm test

# Web dashboard tests
cd web-dashboard
NODE_ENV=test npm run test
```

## 📊 Environment Monitoring

### Health Checks

Add environment validation to health check endpoints:

```javascript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  res.json({
    status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
    environment: process.env.NODE_ENV,
    missingEnvVars: missingVars,
    timestamp: new Date().toISOString(),
  });
});
```

### Configuration Validation

```javascript
// Validate configuration on startup
const validateConfig = () => {
  const required = ['JWT_SECRET', 'DB_HOST', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Validate formats
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    console.error('PORT must be a valid number');
    process.exit(1);
  }
};
```

## 🚀 Deployment Configurations

### Development
- Local database
- Debug logging enabled
- Hot reloading enabled
- Detailed error messages

### Staging
- Production-like database
- Reduced logging
- Performance monitoring
- Error tracking enabled

### Production
- Production database with SSL
- Minimal logging
- Security headers enabled
- Secrets from environment service

## ❗ Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   ```bash
   # Check file exists and has correct name
   ls -la .env*

   # Check file permissions
   chmod 644 .env
   ```

2. **Variables not available in code**:
   ```javascript
   // Debug: Print all environment variables
   console.log(process.env);

   // Check specific variable
   console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
   ```

3. **Docker environment issues**:
   ```bash
   # Check environment in container
   docker exec -it container_name env

   # Verify docker-compose environment
   docker-compose config
   ```

4. **Next.js public variables not working**:
   - Ensure variables start with `NEXT_PUBLIC_`
   - Restart development server after adding variables
   - Check browser's network tab for build-time variables

### Validation Scripts

Create validation script:

```bash
#!/bin/bash
# validate-env.sh

echo "Validating environment configuration..."

# Check required files exist
files=("backend/.env" "web-dashboard/.env.local" "mobile-app/.env")
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    exit 1
  else
    echo "✅ Found: $file"
  fi
done

# Test database connection
echo "Testing database connection..."
cd backend && npm run db:test

echo "Environment validation complete!"
```

## ✅ Configuration Checklist

### Development Setup
- [ ] All `.env` files created from examples
- [ ] Database credentials configured
- [ ] JWT secret generated
- [ ] API URLs point to localhost
- [ ] Debug settings enabled
- [ ] Services can communicate

### Production Setup
- [ ] Environment variables secured
- [ ] Unique JWT secrets generated
- [ ] Production database configured
- [ ] SSL/TLS enabled
- [ ] Debug settings disabled
- [ ] Error tracking configured
- [ ] Monitoring enabled

### Security Review
- [ ] No secrets committed to version control
- [ ] Strong passwords and secrets used
- [ ] Environment variable access restricted
- [ ] Regular secret rotation planned
- [ ] Security headers configured

---

**Need Help?** Check our [Troubleshooting Guide](troubleshooting/COMMON_ISSUES.md) for environment-specific issues.