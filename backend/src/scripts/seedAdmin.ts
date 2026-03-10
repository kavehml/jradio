import dotenv from 'dotenv';
import { initDb, sequelize } from '../db';
import '../db/models/User';
import { User } from '../db/models/User';
import { createUser } from '../services/authService';

dotenv.config();

async function run() {
  await initDb();
  await sequelize.sync();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Admin user with email ${email} already exists.`);
    process.exit(0);
  }

  const user = await createUser({
    name: 'Admin User',
    email,
    password,
    role: 'admin',
  });

  // eslint-disable-next-line no-console
  console.log('Seeded admin user:', { email: user.email, password });
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to seed admin', err);
  process.exit(1);
});
