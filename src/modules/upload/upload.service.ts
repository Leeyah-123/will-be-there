import { unlink } from 'fs/promises';
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '../../core/types';
import cloudinary from '../../lib/cloudinary';
import pino from 'pino';

export default class UploadService {
  private readonly IMAGE_UPLOAD_PATH = 'will-be-there-uploads';

  async uploadImage(
    logger: pino.Logger,
    image: Express.Multer.File
  ): Promise<ServiceResponse<{ publicUrl: string }>> {
    if (!image)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Image not provided',
      };

    if (!image.mimetype.includes('image'))
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Invalid image provided',
      };

    const imagePath = `${Date.now()}_${image.filename}`;

    logger.info(`Uploading image: ${imagePath}`);
    const uploadResult = await cloudinary.uploader.upload(image.path, {
      folder: this.IMAGE_UPLOAD_PATH,
      filename_override: imagePath,
    });

    // delete image after upload
    await unlink(image.path).catch((err) => {
      console.error('Unable to delete image after upload', err);
    });

    return {
      message: 'Image uploaded successfully',
      data: { publicUrl: uploadResult.secure_url },
    };
  }

  async uploadImages(
    logger: pino.Logger,
    images: Express.Multer.File[]
  ): Promise<ServiceResponse<string[]>> {
    if (!images)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Images not provided',
      };

    const imagePromises = images.map(async (image) => {
      if (!image.mimetype.includes('image'))
        return {
          status: StatusCodes.BAD_REQUEST,
          message: 'Invalid image(s) provided',
        };

      logger.info(`Uploading image: ${image.originalname}`);
      return this.uploadImage(logger, image);
    });

    const results = await Promise.all(imagePromises);

    return {
      message: 'Images uploaded successfully',
      data: results.map((result) => result.data?.publicUrl!!),
    };
  }
}
