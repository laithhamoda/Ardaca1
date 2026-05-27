import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Organisation } from '../entities/organisation.entity';
import { UserOrganisation } from '../entities/user-organisation.entity';
import * as bcrypt from 'bcrypt';

config({ path: process.cwd() + '/.env' });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ardaca',
  synchronize: false,
  logging: false,
  entities: [User, Organisation, UserOrganisation],
});

async function seed() {
  await dataSource.initialize();

  const organisationRepo = dataSource.getRepository(Organisation);
  const userRepo = dataSource.getRepository(User);
  const userOrgRepo = dataSource.getRepository(UserOrganisation);

  const org = organisationRepo.create({
    name: 'Ardaca Enterprise',
    countryCode: 'AE',
    active: true,
  });
  await organisationRepo.save(org);

  const admin = userRepo.create({
    email: process.env.SEED_ADMIN_EMAIL || 'admin@ardaca.com',
    fullName: 'Ardaca Platform Admin',
    role: UserRole.SUPER_ADMIN,
    emailVerified: true,
    password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'StrongP@ssw0rd', 12),
  });
  await userRepo.save(admin);

  const membership = userOrgRepo.create({
    user: admin,
    organisation: org,
    role: UserRole.SUPER_ADMIN,
    primary: true,
  });
  await userOrgRepo.save(membership);

  console.log('Seed complete. Admin user:', admin.email, 'Organisation:', org.name);
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
