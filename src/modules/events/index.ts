import { Router } from 'express';
import { validateRequest } from '../../middlewares';
import EventsController from './events.controller';
import { eventCreationValidationSchema } from './events.validator';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const Controller = new EventsController();

router.get('/', Controller.getEvents);
router.get('/id/:id', Controller.getEventById);
router.get('/user/:id', Controller.getEventsByUserId);
router.post(
  '/',
  authMiddleware,
  validateRequest(eventCreationValidationSchema),
  Controller.createEvent
);

export default router;
