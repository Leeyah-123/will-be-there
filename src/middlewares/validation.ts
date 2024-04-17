import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const validationResponse = await schema.safeParseAsync(req.body);
    if (validationResponse.success === false) {
      return res.status(400).json({
        message: 'Validation failed',
        data: validationResponse.error.flatten().fieldErrors,
      });
    }
    next();
  };
