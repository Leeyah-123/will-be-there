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

export const eventCreationValidationSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  description: z.string().min(3, {
    message: 'Description must be at least 3 characters',
  }),
  date: z.string().datetime(),
  type: z.nativeEnum(EventType).or(
    z.string().min(2, {
      message: 'Type must be at least 3 characters',
    })
  ),
  items: z.string().array(),
  visibility: z.nativeEnum(EventVisibility),
  location: z.string(),
  locationReleaseDate: z.string().datetime().optional(),
  image: z.string().url({ message: 'Invalid image URL' }),
  maxGuests: z
    .number()
    .min(1, { message: 'Max guests must be at least 1' })
    .optional(),
});
