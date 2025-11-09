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

// For saving file metadata to database
export const SaveFileSchema = z.object({
  s3Key: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  contentType: z.string().min(1),
  userId: z.string().min(1),
});

export type SaveFileRequest = z.infer<typeof SaveFileSchema>;
