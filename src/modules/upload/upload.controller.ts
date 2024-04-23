import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import UploadService from './upload.service';

export default class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();

    this.uploadImage = this.uploadImage.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
  }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = req.file as Express.Multer.File;
      if (!image) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: 'No image was provided' });
      }

      const response = await this.uploadService.uploadImage(req.logger, image);
      return res.status(response.status || StatusCodes.CREATED).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const images = req.files as Express.Multer.File[];
      if (!images || images.length === 0) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: 'No images were provided' });
      }

      const response = await this.uploadService.uploadImages(
        req.logger,
        images
      );
      return res.status(response.status || StatusCodes.CREATED).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.params;
      if (!url || !z.string().url().safeParse(url).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid URL',
        });
      }

      await this.uploadService.deleteImage(url);

      return res.status(StatusCodes.NO_CONTENT);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }
}
