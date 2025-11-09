import { z } from "zod";

export const PresignedURLRequestSchema = z.object({
  fileName: z.string().min(1, "File name required"),
  contentType: z.enum([
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
});

export type PresignedUrlRequest = z.infer<typeof PresignedURLRequestSchema>;

export const PresignedURLResponseSchema = z.object({
  uploadURL: z.string().url(),
});

export type PresignedUrlResponse = z.infer<typeof PresignedURLResponseSchema>;
