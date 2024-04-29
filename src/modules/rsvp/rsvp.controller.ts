import axios, { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import RsvpService from './rsvp.service';

export default class RsvpController {
  private readonly rsvpService: RsvpService;

  constructor() {
    this.rsvpService = new RsvpService();

    this.getRsvpById = this.getRsvpById.bind(this);
    this.getRsvpsForUser = this.getRsvpsForUser.bind(this);
    this.getRsvpsByEventId = this.getRsvpsByEventId.bind(this);
    this.respondToEvent = this.respondToEvent.bind(this);
    this.updateRsvp = this.updateRsvp.bind(this);
    this.uploadEventImages = this.uploadEventImages.bind(this);
  }

  async getRsvpById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const rsvp = await this.rsvpService.getRsvpById(req.logger, id);
      if (!rsvp) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Rsvp not found',
        });
      }

      return res.json(rsvp);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getRsvpsForUser(req: Request, res: Response, next: NextFunction) {
    try {
      const rsvp = await this.rsvpService.getRsvpsByUserId(
        req.logger,
        req.user.id
      );
      if (!rsvp) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Rsvp not found',
        });
      }

      return res.json(rsvp);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getRsvpsByEventId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const rsvp = await this.rsvpService.getRsvpsByEventId(req.logger, id);
      if (!rsvp) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Rsvp not found',
        });
      }

      return res.json(rsvp);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async respondToEvent(req: Request, res: Response, next: NextFunction) {
    try {
      let user;

      // Obtain currently logged in user info, if exists
      let token = req.header('Authorization');

      if (token) {
        try {
          // Fetch user from authentication server using axios
          const response = await axios.get(
            `${process.env.AUTH_SERVER_URL}/api/profile`,
            {
              headers: {
                Authorization: `${token}`,
              },
            }
          );
          user = response.data;
        } catch (err) {
          if (err instanceof AxiosError) {
            if (err.statusCode === 401) {
              return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Invalid or expired token provided' });
            }
          } else
            return res.status(500).json({ message: 'Something went wrong' });
        }
      }

      const response = await this.rsvpService.respondToEvent(
        req.logger,
        req.body,
        user
      );
      return res.status(response.status || StatusCodes.OK).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async updateRsvp(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.rsvpService.updateRsvpStatus(
        req.logger,
        req.user.id,
        req.body
      );
      return res.status(response.status || StatusCodes.OK).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async uploadEventImages(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.rsvpService.uploadEventImages(
        req.logger,
        req.user.id,
        req.body
      );
      return res.status(response.status || StatusCodes.OK).json({
        message: response.message,
        data: response.data,
      });
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }
}
