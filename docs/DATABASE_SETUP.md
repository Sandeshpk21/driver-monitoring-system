# Database Setup Guide

This guide provides comprehensive instructions for setting up PostgreSQL and configuring the database for the Driver Monitoring System.

## 📋 Prerequisites

- PostgreSQL 14+ installed
- pgAdmin 4 (recommended for GUI management)
- Basic understanding of SQL

## 🗄️ PostgreSQL Installation

### Windows

1. **Download PostgreSQL**
   - Visit [PostgreSQL Download Page](https://www.postgresql.org/download/windows/)
   - Download the installer for your Windows version

2. **Run Installation**
   - Run the installer as Administrator
   - Choose installation directory (default: `C:\Program Files\PostgreSQL\14`)
   - Select components:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4
     - ✅ Stack Builder
     - ✅ Command Line Tools

3. **Configuration During Install**
   - **Data Directory**: Default location is fine
   - **Password**: Set a strong password for `postgres` superuser (remember this!)
   - **Port**: 5432 (default)
   - **Locale**: Default locale

4. **Complete Installation**
   - Click "Next" through remaining steps
   - Launch pgAdmin 4 when installation completes

### macOS

```bash
# Using Homebrew (recommended)
brew install postgresql@14
brew install --cask pgadmin4

# Start PostgreSQL service
brew services start postgresql@14

# Set password for postgres user
createuser --interactive --pwprompt postgres
```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install PostgreSQL and contrib package
sudo apt install postgresql postgresql-contrib

# Install pgAdmin 4
sudo apt install pgadmin4
```

## 🎛️ pgAdmin 4 Setup

### First Launch

1. **Open pgAdmin 4**
   - Windows: Start Menu → pgAdmin 4
   - macOS: Applications → pgAdmin 4
   - Linux: Applications menu → pgAdmin 4

2. **Set Master Password**
   - Create a master password for pgAdmin (different from PostgreSQL password)
   - This encrypts your saved database passwords

3. **Register PostgreSQL Server**
   - Right-click "Servers" in the left panel
   - Select "Register" → "Server..."

### Server Registration

**General Tab:**
- **Name**: `Local PostgreSQL` (or any descriptive name)

**Connection Tab:**
- **Host name/address**: `localhost`
- **Port**: `5432`
- **Maintenance database**: `postgres`
- **Username**: `postgres`
- **Password**: (the password you set during PostgreSQL installation)
- **Save password**: ✅ (recommended)

**Click "Save"**

## 🏗️ Database Creation

### Method 1: Using pgAdmin (Recommended)

1. **Create Database**
   - Expand your server in pgAdmin
   - Right-click "Databases"
   - Select "Create" → "Database..."

   **Database Details:**
   - **Database**: `driver_monitoring`
   - **Owner**: `postgres`
   - **Encoding**: `UTF8`
   - **Tablespace**: `pg_default`
   - **Connection limit**: `-1` (unlimited)

2. **Create Application User**
   - Right-click "Login/Group Roles"
   - Select "Create" → "Login/Group Role..."

   **General Tab:**
   - **Name**: `dms_user`

   **Definition Tab:**
   - **Password**: `dms_password`
   - **Password expiration**: (leave empty)

   **Privileges Tab:**
   - ✅ **Can login?**
   - ✅ **Superuser?** (for development only)

   **Click "Save"**

3. **Grant Database Permissions**
   - Right-click `driver_monitoring` database
   - Select "Properties..."
   - Go to "Security" tab
   - Click "+" to add a user
   - **Grantee**: `dms_user`
   - **Privileges**: Select ALL
   - **Click "Save"**

### Method 2: Using Command Line

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE driver_monitoring
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

# Create application user
CREATE USER dms_user WITH
    LOGIN
    PASSWORD 'dms_password'
    CREATEDB;

# Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE driver_monitoring TO dms_user;

# Grant schema privileges
\c driver_monitoring
GRANT ALL ON SCHEMA public TO dms_user;

# Exit PostgreSQL
\q
```

## 📊 Initialize Database Schema

### Using the Initialization Script

1. **Navigate to Project Root**
   ```bash
   cd /path/to/driver-monitoring-system
   ```

2. **Run Initialization Script**
   ```bash
   psql -U dms_user -d driver_monitoring -f backend/sql/init.sql
   ```

   **Expected Output:**
   ```sql
   CREATE EXTENSION
   CREATE TABLE
   CREATE TABLE
   CREATE TABLE
   CREATE TABLE
   CREATE TABLE
   CREATE TABLE
   CREATE INDEX
   CREATE INDEX
   ...
   CREATE TRIGGER
   CREATE FUNCTION
   INSERT 0 1
   INSERT 0 1
   CREATE VIEW
   CREATE VIEW
   ```

### Verify Installation

```bash
# Connect to the database
psql -U dms_user -d driver_monitoring

# List all tables
\dt

# Expected tables:
# users, drivers, sessions, alerts, detection_metrics, sync_operations, user_settings, calibration_data

# Check sample data
SELECT * FROM users;

# Expected output: 2 users (admin and manager)

# Exit
\q
```

## 🏗️ Database Schema Overview

### Core Tables

1. **users** - All system users (drivers, admins, managers)
2. **drivers** - Extended driver information
3. **sessions** - Driving sessions/trips
4. **alerts** - Detection alerts and warnings
5. **detection_metrics** - Raw detection data
6. **sync_operations** - Offline sync tracking
7. **user_settings** - Application preferences
8. **calibration_data** - Detection calibration data

### Relationships

```
users (1) ─────────── (1) drivers
  │
  │ (1)
  │
  └─── sessions (many)
         │
         │ (1)
         │
         ├── alerts (many)
         └── detection_metrics (many)
```

### Default Users

The initialization script creates two default users:

1. **Admin User**
   - Email: `admin@dms.com`
   - Password: `admin123` (hashed in database)
   - Role: `admin`

2. **Manager User**
   - Email: `manager@dms.com`
   - Password: `manager123` (hashed in database)
   - Role: `manager`

## 🔐 Security Configuration

### Production Security Settings

For production deployment, update `postgresql.conf`:

```conf
# Connection settings
listen_addresses = 'localhost'  # or specific IPs
max_connections = 100

# Security settings
ssl = on
password_encryption = scram-sha-256

# Logging
log_connections = on
log_disconnections = on
log_statement = 'mod'  # Log modifications
```

### Database User Permissions

For production, create a restricted user:

```sql
-- Create restricted user
CREATE USER dms_app_user WITH PASSWORD 'secure_production_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE driver_monitoring TO dms_app_user;
GRANT USAGE ON SCHEMA public TO dms_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dms_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dms_app_user;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dms_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dms_app_user;
```

## 📈 Database Maintenance

### Backup

```bash
# Create backup
pg_dump -U dms_user -d driver_monitoring -f backup_$(date +%Y%m%d).sql

# Create compressed backup
pg_dump -U dms_user -d driver_monitoring | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore from backup
psql -U dms_user -d driver_monitoring_restored -f backup_20240101.sql

# Restore from compressed backup
gunzip -c backup_20240101.sql.gz | psql -U dms_user -d driver_monitoring_restored
```

### Performance Monitoring

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('driver_monitoring'));

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

## 🐳 Docker Database Setup

If using Docker for development:

```yaml
# docker-compose.yml excerpt
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: driver_monitoring
      POSTGRES_USER: dms_user
      POSTGRES_PASSWORD: dms_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
```

## ❗ Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql  # Linux
   brew services list | grep postgresql  # macOS

   # Start PostgreSQL service
   sudo systemctl start postgresql  # Linux
   brew services start postgresql@14  # macOS
   ```

2. **Authentication Failed**
   - Check username and password
   - Verify user exists: `\du` in psql
   - Check pg_hba.conf authentication settings

3. **Permission Denied**
   ```sql
   -- Grant necessary permissions
   GRANT ALL PRIVILEGES ON DATABASE driver_monitoring TO dms_user;
   GRANT ALL ON SCHEMA public TO dms_user;
   ```

4. **Database Does Not Exist**
   ```sql
   -- List all databases
   \l

   -- Create database if missing
   CREATE DATABASE driver_monitoring;
   ```

### Checking Configuration

```bash
# Find PostgreSQL config files
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"

# Check current settings
sudo -u postgres psql -c "SHOW port;"
sudo -u postgres psql -c "SHOW listen_addresses;"
```

### pgAdmin Connection Issues

1. **Clear pgAdmin cache**
   - Close pgAdmin
   - Delete cache folder:
     - Windows: `%APPDATA%\pgadmin`
     - macOS: `~/Library/Preferences/pgadmin`
     - Linux: `~/.pgadmin`

2. **Reset master password**
   - Delete pgAdmin config file and restart

## ✅ Database Setup Checklist

- [ ] PostgreSQL 14+ installed and running
- [ ] pgAdmin 4 installed and configured
- [ ] PostgreSQL server registered in pgAdmin
- [ ] `driver_monitoring` database created
- [ ] `dms_user` created with proper permissions
- [ ] Database schema initialized (`init.sql` executed)
- [ ] Default users created (admin, manager)
- [ ] Connection test successful
- [ ] Backup strategy planned (for production)

## 🚀 Next Steps

After database setup:

1. **Configure Application** - Update `.env` files with database credentials
2. **Test Connection** - Run `npm run dev` to verify backend connects
3. **Explore Schema** - Review [Database Schema Documentation](backend/DATABASE_SCHEMA.md)
4. **Set up Monitoring** - Configure database performance monitoring

---

**Need Help?** Check our [Troubleshooting Guide](troubleshooting/COMMON_ISSUES.md) for database-related issues.