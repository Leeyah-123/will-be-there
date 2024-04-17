import { Event, PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import schedule from 'node-schedule';
import pino from 'pino';
import { ServiceResponse } from '../../core/types';
import { EmailService } from '../email/email.service';
import { EventCreationDto } from './events.validator';

export default class EventsService {
  private readonly prisma: PrismaClient;
  private readonly emailService: EmailService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
  }

  async getEvents(logger: pino.Logger): Promise<Event[]> {
    logger.info('Fetching events');
    try {
      await this.emailService.sendEmail({
        subject: `Event Location Announcement`,
        recipient: 'aaliyahjunaid31@gmail.com',
        templateId: 8191,
        variables: {
          name: 'Wee',
          location: 'No. 10 Garki Street',
        },
      });
    } catch (err) {
      console.error(err);
    }

    return this.prisma.event.findMany();
  }

  async getEventById(logger: pino.Logger, id: string): Promise<Event | null> {
    logger.info('Fetching event');
    return this.prisma.event.findUnique({ where: { id } });
  }

  async getEventsByUserId(
    logger: pino.Logger,
    userId: string
  ): Promise<Event[]> {
    logger.info('Fetching events by user');
    const events = await this.prisma.event.findMany({
      where: { userId },
    });
    return events;
  }

  async createEvent(
    logger: pino.Logger,
    userId: string,
    dto: EventCreationDto
  ): Promise<ServiceResponse<Event>> {
    if (new Date(dto.date) < new Date()) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event date must be in the future',
      };
    }
    if (dto.locationReleaseDate) {
      if (new Date(dto.date) < new Date(dto.locationReleaseDate)) {
        return {
          status: StatusCodes.BAD_REQUEST,
          message: 'Location release date must be before event date',
        };
      }
      if (new Date(dto.locationReleaseDate) < new Date()) {
        return {
          status: StatusCodes.BAD_REQUEST,
          message: 'Location release date must be in the future',
        };
      }
    }

    logger.info('Creating event');
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        userId,
      },
    });

    if (event.locationReleaseDate) {
      schedule.scheduleJob(event.locationReleaseDate, () => {
        this.releaseLocation(event.id);
      });
    } else {
      await this.releaseLocation(event.id);
    }

    // Schedule a job one week before event date to remind attendees
    const reminderDate = new Date(
      event.date.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    reminderDate.setDate(reminderDate.getDate() - 7);
    schedule.scheduleJob(reminderDate, () => {
      this.sendReminders(event.id);
    });

    return {
      data: event,
    };
  }

  async sendReminders(eventId: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          Rsvp: true,
        },
      });

      if (!event || event.cancelled) return;

      // Create an array of all emails of attending guests in RSVP
      const emails = event.Rsvp.filter((rsvp) => rsvp.attending).map(
        (rsvp) => rsvp.email
      );

      await this.emailService.sendBulkEmail({
        subject: `Event Reminder`,
        recipients: emails,
        templateId: 3116,
        variables: {
          name: event.name,
          date: event.date.toDateString(),
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  async releaseLocation(eventId: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          Rsvp: true,
        },
      });

      if (!event || event.cancelled) return;

      // Create an array of all emails of attending guests in RSVP
      const emails = event.Rsvp.filter((rsvp) => rsvp.attending).map(
        (rsvp) => rsvp.email
      );

      await this.emailService.sendBulkEmail({
        subject: `Event Location Announcement`,
        recipients: emails,
        templateId: 8191,
        variables: {
          name: event.name,
          date: event.date.toDateString(),
          location: event.location,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
