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

const UserFileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  s3Key: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  uploadedAt: z.coerce.date(),
});

export const UserFilesSchema = z.array(UserFileSchema);

export type UserFilesRequestData = z.infer<typeof UserFilesSchema>;

export const UploadCareerDocSchema = z.object({
  customName: z
    .string()
    .max(50, "File name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  document: z
    .instanceof(File, { message: "Please select a file" })
    .refine((file) => file.size > 0, "File is empty")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File must be less than 10MB"
    ),
});
