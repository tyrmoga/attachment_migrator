import { Router } from 'express';
import { listEmployees, listContacts } from '../controllers/listController.js';

const listRouter = Router();

listRouter.get('/employees', listEmployees);
listRouter.get('/contacts', listContacts);

export default listRouter;
