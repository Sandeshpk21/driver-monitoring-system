# Complete Installation Guide

This guide provides step-by-step instructions to set up the Driver Monitoring System from scratch.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **RAM**: Minimum 8GB (16GB recommended for mobile development)
- **Storage**: At least 10GB free space
- **Internet**: Required for initial setup and package downloads

### Required Software
1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/)
4. **pgAdmin 4** (optional but recommended) - [Download](https://www.pgadmin.org/)

### For Mobile Development (Optional)
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Xcode** (macOS only) - Available from Mac App Store
- **Expo CLI** - Installed via npm

## 🚀 Installation Steps

### Step 1: Verify Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version

# Check PostgreSQL (after installation)
psql --version
```

### Step 2: Clone or Extract Project

If you have the project as a ZIP file:
```bash
# Extract to desired location
cd /path/to/desired/location
# Extract the ZIP file here
```

If using Git:
```bash
git clone <repository-url>
cd driver-monitoring-system
```

### Step 3: Install Project Dependencies

```bash
# Install all dependencies for all components
npm run install-all
```

This command will install dependencies for:
- Root project
- Backend API
- Web Dashboard
- Mobile App

**Expected Output:**
```
✓ Root dependencies installed
✓ Backend dependencies installed
✓ Web Dashboard dependencies installed
✓ Mobile App dependencies installed
```

### Step 4: Database Setup

#### Option A: Using pgAdmin (Recommended)

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL Server**
   - Right-click "Servers" → "Register" → "Server"
   - Name: `Local PostgreSQL`
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: (your PostgreSQL password)

3. **Create Database**
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `driver_monitoring`
   - Owner: `postgres`

4. **Create User**
   - Right-click "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab: Name: `dms_user`
   - Definition tab: Password: `dms_password`
   - Privileges tab: Check "Can login?"

5. **Grant Permissions**
   - Right-click `driver_monitoring` database → "Properties" → "Security"
   - Add `dms_user` with all privileges

#### Option B: Using Command Line

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE driver_monitoring;
CREATE USER dms_user WITH ENCRYPTED PASSWORD 'dms_password';
GRANT ALL PRIVILEGES ON DATABASE driver_monitoring TO dms_user;

# Exit PostgreSQL
\q
```

#### Initialize Database Schema

```bash
# Navigate to project root
cd /path/to/driver-monitoring-system

# Run database initialization script
psql -U dms_user -d driver_monitoring -f backend/sql/init.sql
```

**Expected Output:**
```sql
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
INSERT 0 1
INSERT 0 1
```

### Step 5: Environment Configuration

Copy and configure environment files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Web Dashboard environment
cp web-dashboard/.env.example web-dashboard/.env.local

# Mobile App environment
cp mobile-app/.env.example mobile-app/.env
```

**Edit `backend/.env`:**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=driver_monitoring
DB_USER=dms_user
DB_PASSWORD=dms_password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

**Edit `web-dashboard/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Edit `mobile-app/.env`:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Step 6: Seed Database with Default Users

```bash
# Navigate to backend directory
cd backend

# Seed the database with default users
npm run seed:users

# Return to project root
cd ..
```

### Step 7: Start Development Environment

```bash
# Start all services
npm run dev
```

This will start:
- **Backend API** on http://localhost:3001
- **Web Dashboard** on http://localhost:3000
- **Mobile App** Metro bundler

### Step 7: Verify Installation

#### Backend API
Visit http://localhost:3001/health
```json
{
  "success": true,
  "message": "Service healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1.234
}
```

#### Web Dashboard
1. Visit http://localhost:3000
2. Login with one of these accounts:
   - **Admin**: `admin@dms.com` / `admin123`
   - **Manager**: `manager@dms.com` / `manager123`

#### Mobile App
1. Install Expo Go app on your mobile device
2. Scan QR code from Metro bundler
3. Login with driver account:
   - **Driver**: `driver@dms.com` / `driver123`

## 🔧 Individual Component Setup

### Backend Only
```bash
cd backend
npm install
npm run dev
```

### Web Dashboard Only
```bash
cd web-dashboard
npm install
npm run dev
```

### Mobile App Only
```bash
cd mobile-app
npm install
npm start
```

## 🧪 Test Installation

Run the test commands to verify everything is working:

```bash
# Test backend
cd backend
npm test

# Test web dashboard
cd ../web-dashboard
npm run lint
npm run type-check

# Test mobile app
cd ../mobile-app
npm run lint
```

## 🐳 Docker Installation (Alternative)

If you prefer using Docker:

```bash
# Start with Docker Compose
docker-compose up

# Database will be automatically initialized
# Services will be available on same ports
```

## 📱 Mobile Development Setup

### For Android Development
See [Android Setup Guide](mobile/ANDROID_SETUP.md)

### For iOS Development
See [iOS Setup Guide](mobile/IOS_SETUP.md)

### For Expo Development
See [Expo Guide](mobile/EXPO_GUIDE.md)

## ❗ Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports
   npx kill-port 3000 3001
   ```

2. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

3. **Permission Denied**
   ```bash
   # Fix npm permissions (Linux/Mac)
   sudo chown -R $(whoami) ~/.npm
   ```

4. **Node Version Issues**
   ```bash
   # Use Node Version Manager
   nvm use 18
   ```

### Getting Help

- Check [Common Issues](troubleshooting/COMMON_ISSUES.md)
- Review [FAQ](troubleshooting/FAQ.md)
- See [Debug Guide](troubleshooting/DEBUG_GUIDE.md)

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Project dependencies installed (`npm run install-all`)
- [ ] Database created and initialized
- [ ] Default users seeded (`npm run seed:users`)
- [ ] Environment files configured
- [ ] Development server running (`npm run dev`)
- [ ] Backend health check passes
- [ ] Web dashboard login works
- [ ] Mobile app loads (if testing mobile)

## 🚀 Next Steps

After successful installation:

1. **Explore the Web Dashboard** - [Web Dashboard Guide](frontend/WEB_DASHBOARD.md)
2. **Set up Mobile Development** - [Mobile Setup Guides](mobile/)
3. **Learn the API** - [API Documentation](backend/API_DOCUMENTATION.md)
4. **Understand Detection** - [Detection Algorithms](development/DETECTION_ALGORITHMS.md)

---

**Need Help?** Check our [Troubleshooting Guide](troubleshooting/COMMON_ISSUES.md) or create an issue in the project repository.