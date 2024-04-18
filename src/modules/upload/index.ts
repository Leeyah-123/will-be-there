import { Router } from 'express';
import { upload } from '../../middlewares/upload';
import UploadController from './upload.controller';

const router = Router();
const Controller = new UploadController();

router.post('/image', upload.single('image'), Controller.uploadImage);
router.post('/images', upload.array('images'), Controller.uploadImages);

export default router;
