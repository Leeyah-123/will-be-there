import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import UploadController from './upload.controller';

const router = Router();
const Controller = new UploadController();

router.post(
  '/image',
  authMiddleware,
  upload.single('image'),
  Controller.uploadImage
);
router.post(
  '/images',
  authMiddleware,
  upload.array('images'),
  Controller.uploadImages
);
router.delete('/:url', authMiddleware, Controller.deleteImage);

export default router;
