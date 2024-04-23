import { Event, EventVisibility, PrismaClient, Rsvp } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import schedule from 'node-schedule';
import pino from 'pino';
import { ServiceResponse } from '../../core/types';
import { EmailService } from '../email/email.service';
import UsersService from '../users/users.service';
import { EventCreationDto, UpdateEventDto } from './events.validators';

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
    logger.info('Creating event');
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        userId,
      },
    });

    // Schedule a cron job to send an email containing the event location on its release date
    if (event.locationReleaseDate) {
      schedule.scheduleJob(event.locationReleaseDate, async () => {
        await this.releaseLocation(event.id);
      });
    }

    await this.scheduleReminders(event.id, event.date);

    return {
      message: 'Event created successfully',
      data: event,
    };
  }

  async updateEvent(
    logger: pino.Logger,
    userId: string,
    eventId: string,
    dto: UpdateEventDto
  ): Promise<ServiceResponse<Event>> {
    let event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return {
        status: StatusCodes.NOT_FOUND,
        message: 'Event not found',
      };
    }
    if (event?.userId !== userId) {
      return {
        status: StatusCodes.UNAUTHORIZED,
        message: 'You are not authorized to update this event',
      };
    }
    if (event.cancelled) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Cannot update a cancelled event',
      };
    }

    let previousName = dto.name === event.name ? undefined : event.name;

    event = await this.prisma.event.update({
      where: { id: eventId },
      data: dto,
    });

    // Check for values that users who responded should be updated on
    if (
      dto.name ||
      dto.description ||
      dto.location ||
      dto.date ||
      dto.duration
    ) {
      let updatedDetails = `
      ${previousName ? `Name: ${dto.name}\n` : ''}
      ${dto.description ? `Description: ${dto.description}\n` : ''}
      ${
        dto.location &&
        (!event.locationReleaseDate || event.locationReleaseDate < new Date())
          ? `Location: ${dto.location}\n`
          : ''
      }
      ${dto.date ? `Date: ${dto.date.toDateString()}\n` : ''}
      `;

      await this.releaseUpdatedEventDetails(
        eventId,
        updatedDetails,
        previousName
      );
    }

    return {
      message: 'Event updated successfully',
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

  private async scheduleReminders(eventId: string, eventDate: Date) {
    /*
      If event is happening in greater than a week time, schedule a reminder one week before event date to remind attendees. 
      If event is happening in less than a week time, schedule a reminder for a day before the event. 
      If event is happening in less than a day, do not schedule reminder.
    */
    const diff = eventDate.getTime() - new Date().getTime();

    const ONE_WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

    if (diff > ONE_WEEK_IN_MILLISECONDS) {
      const reminderDate = new Date(
        eventDate.getTime() - ONE_WEEK_IN_MILLISECONDS
      );
      schedule.scheduleJob(reminderDate, () => {
        this.sendReminders(eventId);
      });
    } else if (diff > ONE_DAY_IN_MILLISECONDS) {
      const reminderDate = new Date(
        eventDate.getTime() - ONE_DAY_IN_MILLISECONDS
      );
      schedule.scheduleJob(reminderDate, () => {
        this.sendReminders(eventId);
      });
    }
  }

  private async releaseUpdatedEventDetails(
    eventId: string,
    updatedDetails: string,
    previousName: string
  ) {
    try {
      const rsvps = await this.prisma.rsvp.findMany({
        where: { eventId },
      });

      // Create an array of all emails of attending guests in RSVP
      const emails = rsvps
        .filter((rsvp) => rsvp.attending)
        .map((rsvp) => rsvp.email);

      if (emails.length === 0) return;

      await this.emailService.sendBulkEmail({
        subject: 'Will Be There',
        recipients: emails,
        templateId: 2364,
        variables: {
          name: previousName,
          updatedDetails,
        },
      });
    } catch (error) {
      console.error(error);
    }
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

      if (emails.length === 0) return;

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

      if (emails.length === 0) return;

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
