import { z } from 'zod';

export type RespondToEventDto = z.infer<typeof respondToEventValidationSchema>;
export type UpdateRsvpDto = z.infer<typeof updateRsvpValidationSchema>;
export type UploadEventImagesDto = z.infer<typeof uploadEventImagesSchema>;

export const uploadEventImagesSchema = z.object({
  eventId: z.string().uuid(),
  uploads: z.string().url().array(),
});

export const respondToEventValidationSchema = z
  .object({
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
  })
  .superRefine(({ attending, guests, items }, ctx) => {
    if (!attending && (guests.length > 0 || items.length > 0))
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot specify guests or items if not attending',
        path: ['guests', 'items'],
      });
  });

export const updateRsvpValidationSchema = z
  .object({
    eventId: z.string().uuid(),
    attending: z.boolean(),
    congratulatoryMessage: z.string().optional(),
    items: z.string().array(),
    guests: z.string().array(),
  })
  .superRefine(({ attending, guests, items }, ctx) => {
    if (!attending && (guests.length > 0 || items.length > 0))
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot specify guests or items if not attending',
        path: ['guests', 'items'],
      });
  });
