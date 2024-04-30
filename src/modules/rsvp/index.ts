import { Router } from 'express';
import { validateRequest } from '../../middlewares';
import { authMiddleware } from '../../middlewares/auth';
import RsvpController from './rsvp.controller';
import {
  respondToEventValidationSchema,
  uploadEventImagesSchema,
} from './rsvp.validators';

const router = Router();
const Controller = new RsvpController();

router.get('/', authMiddleware, Controller.getRsvpsForUser);
router.get('/id/:id', authMiddleware, Controller.getRsvpById);
router.get('/event/:id', Controller.getRsvpsByEventId);
router.post(
  '/',
  validateRequest(respondToEventValidationSchema),
  Controller.respondToEvent
);
router.post(
  '/images',
  authMiddleware,
  validateRequest(uploadEventImagesSchema),
  Controller.uploadEventImages
);
router.patch('/', authMiddleware, Controller.updateRsvp);

export default router;
