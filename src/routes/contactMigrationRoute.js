import { Router } from 'express';
import contactMigrateController from '../controllers/contactMigrationController.js';

const contactMigrationRouter = Router();

contactMigrationRouter.post('/contacts/:id', contactMigrateController);

export default contactMigrationRouter;
