import { EventVisibility } from '@prisma/client';
import { z } from 'zod';

enum EventType {
  WEDDING = 'wedding',
  BIRTHDAY = 'birthday',
  FUNERAL = 'funeral',
  GRADUATION = 'graduation',
  BRIDAL_SHOWER = 'bridal_shower',
  BOOK_LAUNCH = 'book_launch',
}

export type EventCreationDto = z.infer<typeof eventCreationValidationSchema>;

export const eventCreationValidationSchema = z
  .object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
    description: z.string().min(3, {
      message: 'Description must be at least 3 characters',
    }),
    date: z.coerce.date(),
    duration: z
      .object({
        hours: z.number(),
        minutes: z.number(),
      })
      .optional(),
    type: z.nativeEnum(EventType).or(
      z.string().min(2, {
        message: 'Type must be at least 3 characters',
      })
    ),
    items: z.string().array(),
    visibility: z.nativeEnum(EventVisibility),
    location: z.string(),
    locationReleaseDate: z.coerce.date(),
    image: z.string().url({ message: 'Invalid image URL' }),
    maxGuestsPerAttendee: z.number().optional(),
    maxGuests: z.number().optional(),
  })
  .superRefine(({ date, locationReleaseDate, duration }, ctx) => {
    if (duration) {
      if (duration.hours === 0 && duration.minutes === 0)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duration must be greater than 0',
          path: ['duration'],
        });

      if (new Date(date).getTime() <= new Date().getTime())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Event date must be in the future',
          path: ['date'],
        });

      if (new Date(date).getTime() < new Date(locationReleaseDate).getTime())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location release date must be before event date',
          path: ['locationReleaseDate'],
        });

      if (new Date(locationReleaseDate).getTime() <= new Date().getTime())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location release date must be in the future',
          path: ['locationReleaseDate'],
        });
    }
  });
