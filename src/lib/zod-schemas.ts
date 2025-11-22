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

// ------------------------------------------------------------------
// AI GENERATION SCHEMAS
// ------------------------------------------------------------------

/**
 * Schema for a single STAR interview answer.
 * 
 * The AI SDK uses these descriptions to guide the model on what to generate.
 * For example, describing 'competency' helps the model understand it should
 * pick a specific skill like "Leadership" or "Conflict Resolution".
 */
export const STARAnswerSchema = z.object({
  id: z.number().describe("Unique identifier for the answer, sequential (1, 2, 3...)"),
  competency: z.string().describe("The behavioral competency being addressed (e.g., Leadership, Teamwork, Problem Solving)"),
  question: z.string().describe("The interview question that prompts this story"),
  situation: z.string().describe("The 'Situation' part of the STAR method: Context and background"),
  task: z.string().describe("The 'Task' part of the STAR method: What needed to be done"),
  action: z.string().describe("The 'Action' part of the STAR method: What YOU specifically did"),
  result: z.string().describe("The 'Result' part of the STAR method: The outcome and impact"),
  fullAnswer: z.string().optional().describe("The complete answer text, combining all STAR sections naturally"),
});

/**
 * Schema for the entire generation response.
 * 
 * We wrap the array in an object (`answers`) rather than returning the array directly.
 * This is a best practice for streaming objects, as it gives the stream a stable "root" 
 * and allows us to add other top-level fields later if needed (e.g., "summary", "jobTitle").
 */
export const GenerateAnswersSchema = z.object({
  answers: z.array(STARAnswerSchema).describe("List of generated behavioral interview answers"),
});

// Export TypeScript types derived from the Zod schemas
// Frontend components can import these to ensure type safety when using the data
export type STARAnswer = z.infer<typeof STARAnswerSchema>;
export type GenerateAnswersResponse = z.infer<typeof GenerateAnswersSchema>;
