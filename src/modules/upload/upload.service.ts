import { unlink } from 'fs/promises';
import { StatusCodes } from 'http-status-codes';
import pino from 'pino';
import { ServiceResponse } from '../../core/types';
import cloudinary from '../../lib/cloudinary';
import { RedisService } from '../redis/redis.service';

export default class UploadService {
  private readonly IMAGE_UPLOAD_PATH = 'will-be-there-uploads';
  private readonly REDIS_KEY_PREFIX = 'uploaded-images-id';

  private readonly redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }

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

    // save public_url:id pair to redis
    await this.redisService
      .save(`${this.REDIS_KEY_PREFIX}:${imagePath}`, uploadResult.public_id)
      .catch((err) => console.error('Unable to save public_id to redis', err));

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

  async deleteImage(public_url: string): Promise<void> {
    // fetch image_id from redis
    const public_id = await this.redisService.get(
      `${this.REDIS_KEY_PREFIX}:${public_url}`
    );
    if (!public_id || typeof public_id !== 'string') return;

    const response = await cloudinary.uploader.destroy(public_id, {
      invalidate: true,
    });
    if (response && response.result === 'not found') return;

    // delete public_url:id pair from redis
    await this.redisService.delete(public_id);
  }
}
