-- Driver Monitoring System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (drivers, admins, managers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table (extends users for driver-specific data)
CREATE TABLE drivers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    phone_number VARCHAR(20),
    vehicle_info JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for tracking driver trips
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    location_start JSONB,
    location_end JSONB,
    trip_distance_km DECIMAL(10, 2),
    device_info JSONB,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table for all detection events
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    message TEXT NOT NULL,
    confidence_score DECIMAL(4, 3),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location JSONB,
    metadata JSONB,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detection metrics table for aggregated analytics
CREATE TABLE detection_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync operations table for tracking offline-online data sync
CREATE TABLE sync_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('upload', 'download')),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_driver_id ON sessions(driver_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_alerts_session_id ON alerts(session_id);
CREATE INDEX idx_alerts_driver_id ON alerts(driver_id);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_type_severity ON alerts(alert_type, severity);
CREATE INDEX idx_detection_metrics_session_id ON detection_metrics(session_id);
CREATE INDEX idx_detection_metrics_driver_id ON detection_metrics(driver_id);
CREATE INDEX idx_sync_operations_driver_id ON sync_operations(driver_id);
CREATE INDEX idx_sync_operations_status ON sync_operations(status);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@dms.com',
    '$2b$10$rO5vgGOxFD8B/5uT5qY5S.X8YtKKqZ4Y8gEV4G8oYd0sD4F6fgGYa',
    'System Administrator',
    'admin'
);

-- Insert sample manager user (password: manager123)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'manager@dms.com',
    '$2b$10$Y7xvH9wL2kQ8D6pV1mN5R.Z9UwJHsX3K7qL4P8rMb2cE5T9gHiFy6',
    'Fleet Manager',
    'manager'
);

-- Views for analytics
CREATE VIEW driver_statistics AS
SELECT
    u.id,
    u.full_name,
    u.email,
    COUNT(DISTINCT s.id) as total_sessions,
    COALESCE(SUM(s.duration_seconds), 0) as total_driving_time_seconds,
    COALESCE(SUM(s.trip_distance_km), 0) as total_distance_km,
    COUNT(a.id) as total_alerts,
    COUNT(CASE WHEN a.severity = 'severe' THEN 1 END) as severe_alerts,
    COUNT(CASE WHEN a.severity = 'moderate' THEN 1 END) as moderate_alerts,
    COUNT(CASE WHEN a.severity = 'mild' THEN 1 END) as mild_alerts
FROM users u
LEFT JOIN sessions s ON u.id = s.driver_id
LEFT JOIN alerts a ON u.id = a.driver_id
WHERE u.role = 'driver'
GROUP BY u.id, u.full_name, u.email;

CREATE VIEW alert_trends AS
SELECT
    DATE(timestamp) as alert_date,
    alert_type,
    severity,
    COUNT(*) as alert_count
FROM alerts
GROUP BY DATE(timestamp), alert_type, severity
ORDER BY alert_date DESC;