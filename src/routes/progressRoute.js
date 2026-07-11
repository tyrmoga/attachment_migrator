import { Router } from 'express';
import progressController, { sseController } from '../controllers/progressController.js';

const progressRouter = Router();

progressRouter.get('/:sessionId', progressController);
progressRouter.get('/sse/:sessionId', sseController);

export default progressRouter;
