import { DataSource } from 'typeorm';
import { AdminUser, AdminRole } from '@/auth/entities/admin-user.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdminUsers(dataSource: DataSource) {
  const adminUserRepository = dataSource.getRepository(AdminUser);

  console.log('👤 Seeding admin users...');

  // Create Super Admin
  let admin = await adminUserRepository.findOne({
    where: { email: 'admin@tekpay.zm' },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('TekPay@2024!', 10);
    
    admin = adminUserRepository.create({
      email: 'admin@tekpay.zm',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: hashedPassword,
      role: AdminRole.ADMIN,
      isActive: true,
    });
    
    await adminUserRepository.save(admin);
    console.log('  ✅ Created admin user');
  }

  // Create Manager
  let manager = await adminUserRepository.findOne({
    where: { email: 'manager@tekpay.zm' },
  });

  if (!manager) {
    const hashedPassword = await bcrypt.hash('manager123', 10);
    
    manager = adminUserRepository.create({
      email: 'manager@tekpay.zm',
      firstName: 'Demo',
      lastName: 'Manager',
      passwordHash: hashedPassword,
      role: AdminRole.MANAGER,
      isActive: true,
    });
    
    await adminUserRepository.save(manager);
    console.log('  ✅ Created manager user');
  }

  // Create Viewer
  let viewer = await adminUserRepository.findOne({
    where: { email: 'viewer@tekpay.zm' },
  });

  if (!viewer) {
    const hashedPassword = await bcrypt.hash('viewer123', 10);
    
    viewer = adminUserRepository.create({
      email: 'viewer@tekpay.zm',
      firstName: 'Demo',
      lastName: 'Viewer',
      passwordHash: hashedPassword,
      role: AdminRole.VIEWER,
      isActive: true,
    });
    
    await adminUserRepository.save(viewer);
    console.log('  ✅ Created viewer user');
  }

  console.log('🎉 Admin users seeded successfully!');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('  Admin:   admin@tekpay.zm   / TekPay@2024!');
  console.log('  Manager: manager@tekpay.zm / manager123');
  console.log('  Viewer:  viewer@tekpay.zm  / viewer123');
  console.log('');
  console.log('📋 Role Permissions:');
  console.log('  • Admin:   Full access to everything');
  console.log('  • Manager: Can manage clients + view analytics');
  console.log('  • Viewer:  Read-only access to dashboard');
}
