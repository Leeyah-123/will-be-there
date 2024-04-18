import { Event, EventVisibility, PrismaClient, Rsvp } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import schedule from 'node-schedule';
import pino from 'pino';
import { ServiceResponse } from '../../core/types';
import { EmailService } from '../email/email.service';
import UsersService from '../users/users.service';
import { EventCreationDto } from './events.validators';

export default class EventsService {
  private readonly prisma: PrismaClient;
  private readonly emailService: EmailService;
  private readonly usersService: UsersService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.usersService = new UsersService();
  }

  async getEvents(logger: pino.Logger): Promise<Event[]> {
    logger.info('Fetching events');
    return this.prisma.event.findMany({
      where: { visibility: EventVisibility.PUBLIC },
      orderBy: { date: 'desc' },
    });
  }

  async getEventById(logger: pino.Logger, id: string): Promise<Event | null> {
    logger.info('Fetching event');
    return this.prisma.event.findUnique({ where: { id } });
  }

  async getGuestListForEvent(
    logger: pino.Logger,
    eventId: string
  ): Promise<string[]> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { rsvps: true },
    });
    if (!event) return [];

    logger.info('Fetching guest list for event');
    const guestList = event.rsvps
      .map((rsvp) => [rsvp.name, ...rsvp.guests])
      .flat();
    return guestList;
  }

  async getEventsByUserId(
    logger: pino.Logger,
    userId: string
  ): Promise<ServiceResponse<Event[]>> {
    try {
      const user = await this.usersService.getUserById(userId);
      if (!user)
        return {
          status: StatusCodes.NOT_FOUND,
          message: 'User not found',
        };

      logger.info('Fetching events by user');
      const events = await this.prisma.event.findMany({
        where: { userId },
      });

      return {
        message: 'Events fetched successfully',
        data: events,
      };
    } catch {
      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
      };
    }
  }

  async createEvent(
    logger: pino.Logger,
    userId: string,
    dto: EventCreationDto
  ): Promise<ServiceResponse<Event>> {
    if (new Date(dto.date).getTime() <= new Date().getTime()) {
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
      if (new Date(dto.locationReleaseDate).getTime() <= new Date().getTime()) {
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
        date: new Date(dto.date),
        locationReleaseDate: dto.locationReleaseDate
          ? new Date(dto.locationReleaseDate)
          : null,
        userId,
      },
    });

    if (event.locationReleaseDate) {
      schedule.scheduleJob(event.locationReleaseDate, async () => {
        await this.releaseLocation(event.id);
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
      message: 'Event created successfully',
      data: event,
    };
  }

  async cancelEvent(
    logger: pino.Logger,
    userId: string,
    id: string
  ): Promise<ServiceResponse<Event | null>> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      return {
        status: StatusCodes.NOT_FOUND,
        message: 'Event not found',
      };
    }
    if (event?.userId !== userId) {
      return {
        status: StatusCodes.UNAUTHORIZED,
        message: 'You are not authorized to cancel this event',
      };
    }
    if (event.date.getTime() < new Date().getTime()) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event has already taken place',
      };
    }
    if (event.cancelled) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event is already cancelled',
      };
    }

    logger.info('Cancelling event');
    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { cancelled: true },
      include: { rsvps: true },
    });
    await this.announceEventCancellation(updatedEvent);

    return {
      message: 'Event cancelled successfully',
      data: updatedEvent,
    };
  }

  private async sendReminders(eventId: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: true,
        },
      });

      if (!event || event.cancelled) return;

      // Create an array of all emails of attending guests in RSVP
      const emails = event.rsvps
        .filter((rsvp) => rsvp.attending)
        .map((rsvp) => rsvp.email);

      await this.emailService.sendBulkEmail({
        subject: 'Will Be There',
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

  private async releaseLocation(eventId: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: true,
        },
      });

      if (!event || event.cancelled) return;

      // Create an array of all emails of attending guests in RSVP
      const emails = event.rsvps
        .filter((rsvp) => rsvp.attending)
        .map((rsvp) => rsvp.email);

      await this.emailService.sendBulkEmail({
        subject: 'Will Be There',
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

  private async announceEventCancellation(event: Event & { rsvps: Rsvp[] }) {
    try {
      // Create an array of all emails of attending guests in RSVP
      const emails = event.rsvps
        .filter((rsvp) => rsvp.attending)
        .map((rsvp) => rsvp.email);

      await this.emailService.sendBulkEmail({
        subject: 'Will Be There',
        recipients: emails,
        templateId: 8618,
        variables: {
          name: event.name,
          date: event.date.toDateString(),
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
