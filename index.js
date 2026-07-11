import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import './src/odoo/src_db.js';
import './src/odoo/dest_db.js';
import { basicAuth } from './src/middleware/auth.js';
import authRouter from './src/routes/authRoute.js';
import migrationRouter from './src/routes/migrationRoute.js';
import contactMigrationRouter from './src/routes/contactMigrationRoute.js';
import listRouter from './src/routes/listRoute.js';
import dlqRouter from './src/routes/dlqRoute.js';
import progressRouter from './src/routes/progressRoute.js';
import './src/queues/attachmentQueue.js';

const app = express();
const PORT = process.env.PORT || 8500;

app.use(express.json());
// Remove or comment out static serving if using nginx — nginx handles it faster.
// If running standalone (no nginx), uncomment below:
// app.use(express.static(path.resolve('../frontend/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve('../frontend/dist/index.html'));
// });

app.use('/api/auth', authRouter);
app.use('/api', basicAuth);
app.use('/api/migrate', migrationRouter);
app.use('/api/migrate', contactMigrationRouter);
app.use('/api/list', listRouter);
app.use('/api/dlq', dlqRouter);
app.use('/api/progress', progressRouter);

app.listen(PORT, () => {
    console.log(`Backend Server is running on port ${PORT}`);
});
