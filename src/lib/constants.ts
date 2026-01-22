/**
 * Application-wide constants
 * Centralized configuration for magic numbers and timeouts
 */

// ============================================
// AI & GENERATION SETTINGS
// ============================================
export const AI_GENERATION = {
  BATCH_SIZE: 5, // Generate 5 answers per batch to avoid JSON parse errors
  TARGET_TOTAL_ANSWERS: 25, // Total interview answers to generate
  PROMPT_TEMPERATURE: 0.7, // AI creativity level (0-1)
  MAX_RESUME_SIZE_BYTES: 10 * 1024 * 1024, // 10MB max for resume/document
} as const;

// ============================================
// VIDEO & TRANSCRIPTION SETTINGS
// ============================================
export const VIDEO = {
  MAX_VIDEO_DURATION_SECONDS: 600, // 10 minutes
  FILE_SIZE_TO_DURATION_FACTOR: 1024 * 100, // Bytes per second estimate (rough)
} as const;

// ============================================
// TIMEOUT SETTINGS (in milliseconds)
// ============================================
export const TIMEOUTS = {
  TRANSCRIPTION_API_MS: 12 * 60 * 1000, // 12 minutes for Whisper API
  INNGEST_TRANSCRIPTION_FINISH: "15m", // 15 minutes for entire transcription step
  INNGEST_ANALYSIS_FINISH: "5m", // 5 minutes for AI analysis step
  SESSION_POLLING_MS: 2000, // Frontend polls for answers every 2 seconds
  INNGEST_POLL_INTERVAL_MS: 500, // Backend polls DB every 500ms for saved answers
  SSE_HEARTBEAT_MS: 30000, // Send heartbeat every 30 seconds to keep connection alive
} as const;

// ============================================
// S3 & FILE SETTINGS
// ============================================
export const S3 = {
  PRESIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
  REGION: "ap-southeast-1",
  AWS_S3_BUCKET_ENV: "AWS_S3_BUCKET",
} as const;

// ============================================
// DATABASE & PAGINATION
// ============================================
export const DATABASE = {
  SESSIONS_PAGE_SIZE: 20, // Load 20 sessions at a time
} as const;

// ============================================
// VALIDATION RULES
// ============================================
export const VALIDATION = {
  FILE_NAME_MAX_LENGTH: 50,
  CONTENT_FIDELITY_MIN: 0,
  CONTENT_FIDELITY_MAX: 100,
  SCORE_GOOD_THRESHOLD: 60, // 60+ is considered "good" feedback
  QUESTION_MIN_LENGTH: 10,
} as const;

// ============================================
// OPENAI QUOTA ERROR CODES
// ============================================
export const OPENAI_ERRORS = {
  RATE_LIMIT_CODE: 429,
  QUOTA_EXCEEDED_PHRASES: ["quota", "limit", "exceeded"],
} as const;

// ============================================
// UI TIMING
// ============================================
export const UI_TIMING = {
  TOAST_SUCCESS_DELAY_MS: 2000,
  TOAST_INFO_DURATION_MS: 6000,
  DIALOG_AUTO_CLOSE_MS: 2000,
  POLLING_RETRY_MS: 500,
} as const;
