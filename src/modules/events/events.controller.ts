import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import EventsService from './events.service';

export default class EventsController {
  private eventsService: EventsService;

  constructor() {
    this.eventsService = new EventsService();

    this.getEvents = this.getEvents.bind(this);
    this.getEventById = this.getEventById.bind(this);
    this.getEventsByUserId = this.getEventsByUserId.bind(this);
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.eventsService.getEvents(req.logger);
      return res.json(response);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().cuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const event = await this.eventsService.getEventById(req.logger, id);
      if (!event) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Event not found',
        });
      }

      return event;
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getEventsByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.userId;
      if (!id || !z.string().cuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid User ID',
        });
      }

      return this.eventsService.getEventsByUserId(req.logger, id);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;

      const response = await this.eventsService.createEvent(
        req.logger,
        req.user.id,
        dto
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
