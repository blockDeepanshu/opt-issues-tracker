import { z } from "zod";

export const messageCreateSchema = z
  .object({
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    imageId: z.string().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.message?.trim() || data.imageId), {
    message: "Add a message or image.",
  });
