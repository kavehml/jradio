import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, sequelize } from './db';
import './db/models/User';
import './db/models/RadiologistProfile';
import './db/models/ShiftAssignment';
import './db/models/ImagingCategory';
import './db/models/Requisition';
import './db/models/RequisitionImagingItem';
import './db/models/Visit';
import './db/models/Assignments';
import './db/models/BacklogThreshold';
import authRoutes from './routes/authRoutes';
import backlogRoutes from './routes/backlogRoutes';
import importExportRoutes from './routes/importExportRoutes';

dotenv.config();

async function bootstrap() {
  await initDb();
  await sequelize.sync();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/backlog', backlogRoutes);
  app.use('/api/io', importExportRoutes);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start backend', err);
  process.exit(1);
});
