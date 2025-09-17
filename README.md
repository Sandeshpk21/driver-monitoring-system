# Driver Monitoring System

An offline-first driver monitoring system with real-time detection capabilities, featuring a mobile app for drivers and a web dashboard for fleet management.

## System Overview

### Components
- **Mobile App** (React Native): Real-time driver monitoring with offline capabilities
- **Web Dashboard** (Next.js): Analytics and historical data for admins/managers
- **Backend API** (Node.js): Central data management and synchronization
- **Database** (PostgreSQL): Unified data storage

### Key Features
- Real-time drowsiness and distraction detection
- Offline-first architecture with automatic sync
- Historical analytics and reporting
- Role-based access control
- Export capabilities (PDF/CSV)

## Detection Capabilities

Based on computer vision algorithms from dmsv7.py:

- **Eye Closure Detection**: EAR (Eye Aspect Ratio) monitoring
- **Drowsiness Detection**: Combination of eye closure, head droop, and yawning
- **Distraction Detection**: Head turn, gaze deviation, hand positioning
- **Phone Usage**: Hand near ear detection
- **Texting Detection**: Both hands positioned together
- **Yawning Detection**: MAR (Mouth Aspect Ratio) analysis
- **Head Pose Analysis**: Tilt, droop, and turn measurements

## Alert Severity Levels
- **Mild/Warning**: Early indicators
- **Moderate/Alert**: Requires attention
- **Severe**: Immediate action needed

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- React Native development environment
- Android Studio / Xcode (for mobile development)

### Installation
```bash
# Install all dependencies
npm run install-all

# Set up environment variables (see .env.example files)

# Start development servers
npm run dev
```

### Individual Component Setup
```bash
# Backend API
cd backend && npm run dev

# Web Dashboard
cd web-dashboard && npm run dev

# Mobile App
cd mobile-app && npm start
```

## Project Structure

```
driver-monitoring-system/
├── backend/                 # Node.js API server
├── web-dashboard/          # React/Next.js admin dashboard
├── mobile-app/            # React Native mobile app
├── shared/                # Shared utilities and types
└── docs/                 # Documentation
```

## Configuration

Each component has its own environment configuration:
- `backend/.env` - Database and API settings
- `web-dashboard/.env.local` - Dashboard configuration
- `mobile-app/.env` - Mobile app settings

## Development

The system is designed for offline-first operation:
1. Mobile app captures and processes video locally
2. Alerts and trip data stored in local SQLite
3. Data syncs to central database when internet available
4. Web dashboard shows historical analytics from synced data

## License

MIT License - see LICENSE file for details