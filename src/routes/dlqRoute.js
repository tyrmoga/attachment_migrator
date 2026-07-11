import { Router } from 'express';
import { listFailed, retryJob, retryAll, listDuplicates, resolveDuplicate } from '../controllers/dlqController.js';

const dlqRouter = Router();

dlqRouter.get('/failed', listFailed);
dlqRouter.post('/retry/:jobId', retryJob);
dlqRouter.post('/retry-all', retryAll);
dlqRouter.get('/duplicates', listDuplicates);
dlqRouter.post('/resolve-duplicate', resolveDuplicate);

export default dlqRouter;
