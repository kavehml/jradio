import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'radiology_rvu',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

export async function initDb() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (err) {
    console.error('Unable to connect to database', err);
    throw err;
  }
}
