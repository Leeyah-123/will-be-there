import { z } from 'zod';

export type RespondToEventDto = z.infer<typeof respondToEventValidationSchema>;
export type UploadEventImagesDto = z.infer<typeof uploadEventImagesSchema>;

export const uploadEventImagesSchema = z.object({
  eventId: z.string().uuid(),
  uploads: z.string().url().array(),
});

export const respondToEventValidationSchema = z.object({
  eventId: z.string().uuid(),
  firstName: z
    .string()
    .min(2, { message: 'First Name must be at least 2 characters' })
    .optional(),
  lastName: z
    .string()
    .min(2, { message: 'Last Name must be at least 2 characters' })
    .optional(),
  email: z.string().email().optional(),
  attending: z.boolean(),
  congratulatoryMessage: z.string().optional(),
  items: z.string().array(),
  guests: z.string().array(),
});
