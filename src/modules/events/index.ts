import { Router } from 'express';
import { validateRequest } from '../../middlewares';
import { authMiddleware } from '../../middlewares/auth';
import EventsController from './events.controller';
import { eventCreationValidationSchema } from './events.validators';

const router = Router();
const Controller = new EventsController();

router.get('/', Controller.getEvents);
router.get('/id/:id', Controller.getEventById);
router.get('/guests/:id', Controller.getGuestListForEvent);
router.get('/user', authMiddleware, Controller.getEventsByUser);
router.post(
  '/',
  authMiddleware,
  validateRequest(eventCreationValidationSchema),
  Controller.createEvent
);
router.patch(
  '/:id',
  authMiddleware,
  validateRequest(eventCreationValidationSchema),
  Controller.updateEvent
);
router.patch('/cancel/:id', authMiddleware, Controller.cancelEvent);

export default router;
