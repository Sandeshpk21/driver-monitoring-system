# Driver Monitoring System - Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

1. **Install all dependencies**:
```bash
npm run install-all
```

2. **Set up PostgreSQL database**:
```sql
CREATE DATABASE driver_monitoring;
CREATE USER dms_user WITH ENCRYPTED PASSWORD 'dms_password';
GRANT ALL PRIVILEGES ON DATABASE driver_monitoring TO dms_user;
```

3. **Initialize the database**:
```bash
# Start PostgreSQL and run the init script
psql -d driver_monitoring -f backend/sql/init.sql
```

4. **Start the development environment**:
```bash
npm run dev
```

This will start all three services:
- Backend API: http://localhost:3001
- Web Dashboard: http://localhost:3000
- Mobile App: Metro bundler for React Native

## 📱 Individual Components

### Backend API (Node.js/Express)
```bash
cd backend
npm run dev
```
- API endpoint: http://localhost:3001
- Health check: http://localhost:3001/health
- API docs: http://localhost:3001/api/v1

### Web Dashboard (Next.js)
```bash
cd web-dashboard
npm run dev
```
- Dashboard: http://localhost:3000
- Login with: admin@dms.com / admin123

### Mobile App (React Native/Expo)
```bash
cd mobile-app
npm start
```
- Follow Expo CLI instructions to run on device/simulator

## 🐳 Docker Deployment

### Development with Docker
```bash
docker-compose up
```

### Production Deployment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

**Backend (backend/.env)**:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=driver_monitoring
DB_USER=dms_user
DB_PASSWORD=dms_password
JWT_SECRET=your_super_secret_jwt_key_here
```

**Web Dashboard (web-dashboard/.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Mobile App (mobile-app/.env)**:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Web Dashboard
```bash
cd web-dashboard
npm run lint
npm run type-check
```

### Mobile App
```bash
cd mobile-app
npm test
npm run lint
```

## 📊 System Features

### Detection Algorithms (from dmsv7.py)
- **Eye Monitoring**: EAR threshold 0.140, 9 frame detection
- **Drowsiness**: Combined eye closure + head droop + yawning
- **Distraction**: Head pose, gaze deviation, hand positioning
- **Alert Levels**: Mild (white), Moderate (yellow), Severe (red)

### Mobile App Features
- Offline-first SQLite storage
- Real-time camera processing
- Background sync when online
- Local analytics and trip summaries

### Web Dashboard Features
- Admin/Manager authentication
- Historical data analysis
- Driver performance statistics
- Alert trends and reporting
- Export capabilities

## 🔐 Default Accounts

- **Admin**: admin@dms.com / admin123
- **Manager**: manager@dms.com / manager123

## 🛠️ Development

### Adding New Features
1. Backend: Add routes in `backend/src/routes/`
2. Database: Update schema in `backend/sql/init.sql`
3. Mobile: Add screens in `mobile-app/src/screens/`
4. Web: Add pages in `web-dashboard/pages/`

### Database Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 📱 Mobile Development

### iOS Setup
1. Install Xcode
2. Install iOS Simulator
3. Run: `npm run ios`

### Android Setup
1. Install Android Studio
2. Set up Android SDK
3. Run: `npm run android`

## 🚨 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check connection credentials in `.env`
- Verify database exists and user has permissions

### Mobile App Issues
- Clear Metro cache: `npx react-native start --reset-cache`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Web Dashboard Issues
- Clear Next.js cache: `rm -rf .next && npm run dev`
- Check API URL in `.env.local`

## 📁 Project Structure

```
driver-monitoring-system/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions
│   └── sql/             # Database scripts
├── web-dashboard/       # Next.js admin dashboard
│   ├── pages/           # Next.js pages
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── styles/      # CSS styles
├── mobile-app/          # React Native mobile app
│   └── src/
│       ├── components/  # React Native components
│       ├── screens/     # App screens
│       ├── services/    # Detection & sync services
│       └── utils/       # Utility functions
└── shared/             # Shared utilities and types
```

## 🎯 Next Steps

1. Implement real MediaPipe integration for mobile app
2. Add more analytics dashboards
3. Implement real-time notifications
4. Add data export features
5. Mobile app store deployment preparation