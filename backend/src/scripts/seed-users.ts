import bcrypt from 'bcryptjs';
import { db } from '../utils/database';

async function seedUsers() {
  try {
    console.log('Starting user seeding...');

    // Generate proper password hashes
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const managerPasswordHash = await bcrypt.hash('manager123', 12);
    const driverPasswordHash = await bcrypt.hash('driver123', 12);

    // Check if users already exist
    const checkAdminQuery = 'SELECT id FROM users WHERE email = $1';
    const adminExists = await db.query(checkAdminQuery, ['admin@dms.com']);

    if (adminExists.rows.length === 0) {
      // Insert admin user
      const insertAdminQuery = `
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, full_name, role
      `;
      const adminResult = await db.query(insertAdminQuery, [
        'admin@dms.com',
        adminPasswordHash,
        'System Administrator',
        'admin',
        true
      ]);
      console.log('Admin user created:', adminResult.rows[0]);
    } else {
      // Update existing admin password
      const updateAdminQuery = `
        UPDATE users
        SET password_hash = $1
        WHERE email = $2
        RETURNING id, email, full_name, role
      `;
      const adminResult = await db.query(updateAdminQuery, [
        adminPasswordHash,
        'admin@dms.com'
      ]);
      console.log('Admin user password updated:', adminResult.rows[0]);
    }

    // Check if manager exists
    const checkManagerQuery = 'SELECT id FROM users WHERE email = $1';
    const managerExists = await db.query(checkManagerQuery, ['manager@dms.com']);

    if (managerExists.rows.length === 0) {
      // Insert manager user
      const insertManagerQuery = `
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, full_name, role
      `;
      const managerResult = await db.query(insertManagerQuery, [
        'manager@dms.com',
        managerPasswordHash,
        'Fleet Manager',
        'manager',
        true
      ]);
      console.log('Manager user created:', managerResult.rows[0]);
    } else {
      // Update existing manager password
      const updateManagerQuery = `
        UPDATE users
        SET password_hash = $1
        WHERE email = $2
        RETURNING id, email, full_name, role
      `;
      const managerResult = await db.query(updateManagerQuery, [
        managerPasswordHash,
        'manager@dms.com'
      ]);
      console.log('Manager user password updated:', managerResult.rows[0]);
    }

    // Check if driver exists
    const checkDriverQuery = 'SELECT id FROM users WHERE email = $1';
    const driverExists = await db.query(checkDriverQuery, ['driver@dms.com']);

    if (driverExists.rows.length === 0) {
      // Insert driver user
      const insertDriverQuery = `
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, full_name, role
      `;
      const driverResult = await db.query(insertDriverQuery, [
        'driver@dms.com',
        driverPasswordHash,
        'John Driver',
        'driver',
        true
      ]);
      console.log('Driver user created:', driverResult.rows[0]);
    } else {
      // Update existing driver password
      const updateDriverQuery = `
        UPDATE users
        SET password_hash = $1
        WHERE email = $2
        RETURNING id, email, full_name, role
      `;
      const driverResult = await db.query(updateDriverQuery, [
        driverPasswordHash,
        'driver@dms.com'
      ]);
      console.log('Driver user password updated:', driverResult.rows[0]);
    }

    console.log('\n✅ User seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin: admin@dms.com / admin123');
    console.log('Manager: manager@dms.com / manager123');
    console.log('Driver: driver@dms.com / driver123 (for mobile app testing)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers();