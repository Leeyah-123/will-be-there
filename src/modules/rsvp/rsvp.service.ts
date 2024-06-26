import { Event, PrismaClient, Rsvp } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import pino from 'pino';
import { ServiceResponse } from '../../core/types';
import { User } from '../../utils/types';
import { EmailService } from '../email/email.service';
import {
  RespondToEventDto,
  UpdateRsvpDto,
  UploadEventImagesDto,
} from './rsvp.validators';

export default class RsvpService {
  private readonly prisma: PrismaClient;
  private readonly emailService: EmailService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
  }

  async getRsvpById(logger: pino.Logger, id: string): Promise<Rsvp | null> {
    logger.info('Fetching rsvp');
    return this.prisma.rsvp.findUnique({
      where: { id },
      include: { event: true },
    });
  }

  async getRsvpsByUserId(logger: pino.Logger, userId: string): Promise<Rsvp[]> {
    logger.info('Fetching rsvps');
    return this.prisma.rsvp.findMany({
      where: { userId },
      include: { event: true },
    });
  }

  async getRsvpsByEventId(
    logger: pino.Logger,
    eventId: string
  ): Promise<Rsvp[]> {
    logger.info('Fetching rsvps');
    return this.prisma.rsvp.findMany({ where: { eventId } });
  }

  async respondToEvent(
    logger: pino.Logger,
    dto: RespondToEventDto,
    user?: User
  ): Promise<ServiceResponse<Rsvp>> {
    // Event related validations
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event)
      return {
        status: StatusCodes.NOT_FOUND,
        message: 'Event not found',
      };
    if (event.cancelled)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event is cancelled',
      };
    if (event.date.getTime() <= new Date().getTime())
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event has already taken place',
      };
    if (event.maxGuests && event.guestCount === event.maxGuests)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: 'Event is fully booked',
      };

    // Validate RSVP
    const validationError = await this.validateRsvp(event, dto, user);
    if (validationError)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: validationError,
      };

    logger.info('Responding to event');
    const rsvp = await this.prisma.rsvp.create({
      data: {
        name: user
          ? `${user.first_name} ${user.last_name}`
          : `${dto.firstName} ${dto.lastName}`,
        email: user?.email || dto.email!,
        congratulatoryMessage: dto.congratulatoryMessage,
        attending: dto.attending,
        guests: dto.guests,
        items: dto.items,
        eventId: dto.eventId,
        userId: user?.id,
      },
    });

    if (rsvp.attending) {
      // Update event guest count
      await this.prisma.event.update({
        where: { id: event.id },
        data: {
          guestCount: event.guestCount + rsvp.guests.length + 1,
        },
      });

      // Send location to user immediately if no release date was specified
      if (!event.locationReleaseDate)
        await this.emailService.sendEmail({
          subject: 'Will Be There',
          recipient: rsvp.email,
          templateId: 8191,
          variables: {
            name: event.name,
            date: event.date.toDateString(),
            location: event.location,
          },
        });
    }

    return {
      message: 'Successfully responded to event',
      data: rsvp,
    };
  }

  async updateRsvpStatus(
    logger: pino.Logger,
    userId: string,
    dto: UpdateRsvpDto
  ): Promise<ServiceResponse<Rsvp>> {
    const rsvp = await this.prisma.rsvp.findFirst({
      where: { userId, eventId: dto.eventId },
      include: { event: true },
    });
    if (!rsvp)
      return {
        message: 'Rsvp not found',
        status: StatusCodes.NOT_FOUND,
      };

    // Validate RSVP
    const validationError = await this.validateRsvp(
      rsvp.event,
      dto,
      undefined,
      true,
      rsvp.guests.length
    );
    if (validationError)
      return {
        status: StatusCodes.BAD_REQUEST,
        message: validationError,
      };

    logger.info('Updating rsvp status');
    const updatedRsvp = await this.prisma.rsvp.update({
      where: { id: rsvp.id },
      data: {
        attending: rsvp.attending,
        guests: rsvp.guests,
        congratulatoryMessage: dto.congratulatoryMessage,
        items: dto.items,
      },
    });

    if (dto.attending) {
      if (!rsvp.attending) {
        // Update event guest count
        await this.prisma.event.update({
          where: { id: dto.eventId },
          data: {
            guestCount: rsvp.event.guestCount + rsvp.guests.length + 1,
          },
        });

        // If user was previously not attending but will be attending now, send email containing event location
        if (!rsvp.event.locationReleaseDate)
          await this.emailService.sendEmail({
            subject: 'Will Be There',
            recipient: rsvp.email,
            templateId: 8191,
            variables: {
              name: rsvp.event.name,
              date: rsvp.event.date.toDateString(),
              location: rsvp.event.location,
            },
          });
      } else {
        // Update event guest count
        await this.prisma.event.update({
          where: { id: dto.eventId },
          data: {
            guestCount:
              rsvp.event.guestCount - rsvp.guests.length + dto.guests.length,
          },
        });
      }
    } else {
      await this.prisma.event.update({
        where: { id: dto.eventId },
        data: {
          guestCount: rsvp.event.guestCount - rsvp.guests.length - 1,
        },
      });
    }

    return {
      message: 'Successfully updated rsvp status',
      data: updatedRsvp,
    };
  }

  async uploadEventImages(
    logger: pino.Logger,
    userId: string,
    dto: UploadEventImagesDto
  ): Promise<ServiceResponse<Rsvp>> {
    let rsvp = await this.prisma.rsvp.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        attending: true,
      },
    });
    if (!rsvp) {
      return {
        status: StatusCodes.NOT_FOUND,
        message: 'You did not attend this event',
      };
    }

    logger.info('Save uploads');
    rsvp = await this.prisma.rsvp.update({
      where: { id: rsvp.id },
      data: {
        uploads: [...rsvp.uploads, ...dto.uploads],
      },
    });

    return {
      message: 'Uploads added successfully',
      data: rsvp,
    };
  }

  private async validateRsvp(
    event: Event,
    dto: RespondToEventDto,
    user?: User,
    update?: boolean,
    previousGuestLength?: number
  ) {
    if (!update) {
      if (user) {
        // Ensure user hasn't already responded to event
        const rsvp = await this.prisma.rsvp.findFirst({
          where: { userId: user.id, eventId: dto.eventId },
        });
        if (rsvp) {
          return 'You have already responded to this event';
        }
      }

      // Either a logged in user or a first name, last name and email should be present
      if (!user && (!(dto.firstName && dto.lastName) || !dto.email))
        return 'Please provide required user details';
    }

    // Validate guest count if user specified guests
    if (dto.guests.length > 0) {
      event.guestCount -= previousGuestLength || 0;

      // Make sure no attendee brings more guests than is allowed
      if (
        event.maxGuestsPerAttendee !== null &&
        event.maxGuestsPerAttendee !== undefined &&
        dto.guests.length > event.maxGuestsPerAttendee
      )
        return `Maximum number of guests allowed per attendee is ${event.maxGuestsPerAttendee}`;

      // Ensure max number of guests allowed at the event is not superceded
      const newGuestCount = event.guestCount + dto.guests.length + 1;
      if (event.maxGuests) {
        if (newGuestCount > event.maxGuests)
          return `${event.maxGuests - event.guestCount} guest slots left`;
      }
    }

    // Validate items
    if (dto.items.length > 0) {
      if (event.items.length === 0) return 'Event Host specified no items';

      // Make sure items not specified by the host are not allowed
      if (!dto.items.every((item) => event.items.includes(item)))
        return 'Some items specified are not in event item list';
    }
  }
}
