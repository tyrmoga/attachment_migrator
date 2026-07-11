import { Router } from 'express';
import migrateController from '../controllers/migrationController.js';

const migrationRouter = Router();

migrationRouter.post('/employees/:id', migrateController);

export default migrationRouter;
