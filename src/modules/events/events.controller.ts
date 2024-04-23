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
    this.getGuestListForEvent = this.getGuestListForEvent.bind(this);
    this.getEventsByUser = this.getEventsByUser.bind(this);
    this.createEvent = this.createEvent.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.cancelEvent = this.cancelEvent.bind(this);
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await this.eventsService.getEvents(req.logger);
      return res.json(events);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
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

      return res.json(event);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getGuestListForEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const guestList = await this.eventsService.getGuestListForEvent(
        req.logger,
        id
      );
      return res.json(guestList);
    } catch (err) {
      req.logError((err as Error).message, err);
      next(err);
    }
  }

  async getEventsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.eventsService.getEventsByUserId(
        req.logger,
        req.user.id
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

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const dto = req.body;

      const response = await this.eventsService.updateEvent(
        req.logger,
        req.user.id,
        id,
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

  async cancelEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id || !z.string().uuid().safeParse(id).success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid ID',
        });
      }

      const response = await this.eventsService.cancelEvent(
        req.logger,
        req.user.id,
        id
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
