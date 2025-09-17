# Driver Monitoring System Documentation

Welcome to the comprehensive documentation for the Driver Monitoring System - an offline-first application for real-time driver safety monitoring with computer vision-based detection algorithms.

## 📖 Documentation Overview

### Quick Start
- [Installation Guide](INSTALLATION.md) - Complete setup instructions
- [Database Setup](DATABASE_SETUP.md) - PostgreSQL and pgAdmin configuration
- [Environment Configuration](ENVIRONMENT_CONFIG.md) - Environment variables setup

### Platform Setup
- [Android Setup](mobile/ANDROID_SETUP.md) - Android development environment
- [iOS Setup](mobile/IOS_SETUP.md) - iOS development environment
- [Expo Development](mobile/EXPO_GUIDE.md) - Expo CLI and workflow

### Component Documentation
- [Backend API](backend/API_DOCUMENTATION.md) - REST API reference
- [Database Schema](backend/DATABASE_SCHEMA.md) - Database structure
- [Web Dashboard](frontend/WEB_DASHBOARD.md) - Admin interface guide
- [Mobile App](mobile/MOBILE_APP.md) - Mobile application features

### Development
- [Getting Started](development/GETTING_STARTED.md) - Developer onboarding
- [Detection Algorithms](development/DETECTION_ALGORITHMS.md) - Computer vision implementation
- [Testing Guide](development/TESTING.md) - Testing procedures
- [Deployment](development/DEPLOYMENT.md) - Production deployment

### User Guides
- [Admin Guide](user-guides/ADMIN_GUIDE.md) - Dashboard administration
- [Manager Guide](user-guides/MANAGER_GUIDE.md) - Fleet management
- [Driver Guide](user-guides/DRIVER_GUIDE.md) - Mobile app usage

### Troubleshooting
- [Common Issues](troubleshooting/COMMON_ISSUES.md) - Frequent problems and solutions
- [FAQ](troubleshooting/FAQ.md) - Frequently asked questions
- [Debug Guide](troubleshooting/DEBUG_GUIDE.md) - Debugging procedures

## 🚀 System Overview

The Driver Monitoring System consists of three main components:

### 1. Mobile App (React Native/Expo)
- **Real-time monitoring** using device camera
- **Offline-first architecture** with SQLite storage
- **Detection algorithms** based on computer vision
- **Automatic sync** when internet is available

### 2. Web Dashboard (Next.js/React)
- **Analytics and reporting** for fleet managers
- **Historical data visualization**
- **Driver performance tracking**
- **Role-based access control**

### 3. Backend API (Node.js/Express)
- **RESTful API** for data management
- **PostgreSQL database** for persistent storage
- **JWT authentication** and authorization
- **Sync services** for offline-online data flow

## 🔍 Detection Capabilities

Based on the dmsv7.py computer vision algorithms:

- **Eye Closure Detection** - EAR (Eye Aspect Ratio) monitoring
- **Drowsiness Detection** - Multi-factor analysis including head droop and yawning
- **Distraction Detection** - Head pose, gaze deviation, and hand positioning
- **Phone Usage Detection** - Hand-to-ear positioning analysis
- **Texting Detection** - Both hands positioning patterns
- **Alert System** - Three severity levels with confidence scoring

## 📱 Supported Platforms

- **iOS** - iPhone and iPad devices
- **Android** - Android phones and tablets
- **Web** - Modern browsers (Chrome, Firefox, Safari, Edge)

## 🛠️ Technology Stack

- **Frontend**: React Native (Expo), Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Computer Vision**: MediaPipe, OpenCV concepts
- **Authentication**: JWT tokens with refresh mechanism
- **Deployment**: Docker, Docker Compose

## ⚡ Quick Setup

1. **Prerequisites**: Node.js 18+, PostgreSQL 14+
2. **Install**: `npm run install-all`
3. **Database**: Follow [Database Setup](DATABASE_SETUP.md)
4. **Start**: `npm run dev`

## 📞 Support

- **Issues**: Create an issue in the project repository
- **Documentation**: Check the relevant guide in this docs folder
- **Development**: See [Getting Started](development/GETTING_STARTED.md)

## 🔄 Version Information

- **API Version**: v1
- **Mobile App**: 1.0.0
- **Web Dashboard**: 1.0.0
- **Node.js**: 18+
- **React Native**: 0.72+
- **Next.js**: 14+

---

For detailed setup instructions, start with the [Installation Guide](INSTALLATION.md).