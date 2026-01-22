/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at application startup.
 * Fails fast if any required vars are missing, preventing silent failures
 * in production.
 */

const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: "PostgreSQL connection string",

  // Authentication
  BETTER_AUTH_SECRET: "Better Auth secret key",
  GOOGLE_CLIENT_ID: "Google OAuth client ID",
  GOOGLE_CLIENT_SECRET: "Google OAuth client secret",

  // AWS S3
  AWS_REGION: "AWS region (e.g., ap-southeast-1)",
  AWS_S3_BUCKET: "S3 bucket name for file storage",
  AWS_ACCESS_KEY_ID: "AWS IAM access key",
  AWS_SECRET_ACCESS_KEY: "AWS IAM secret access key",

  // AI & External APIs
  OPENAI_API_KEY: "OpenAI API key for transcription (Whisper)",
  GOOGLE_API_KEY: "Google API key for Gemini AI",

  // Inngest
  INNGEST_KEY: "Inngest signing key for background jobs",
  INNGEST_EVENT_KEY: "Inngest event key",
};

const OPTIONAL_ENV_VARS = {
  NODE_ENV: "Node environment (development, production, etc.)",
  BETTER_AUTH_URL: "Better Auth URL (defaults to http://localhost:3000)",
};

export function validateEnvironment(): {
  success: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}\n  Purpose: ${description}`);
    }
  }

  // Check optional variables and warn if missing
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      warnings.push(`Optional environment variable not set: ${key}\n  Purpose: ${description}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentValidation(): void {
  const validation = validateEnvironment();

  if (!validation.success) {
    console.error("\n❌ ENVIRONMENT VALIDATION FAILED\n");
    console.error("Missing required environment variables:\n");
    validation.errors.forEach((error) => {
      console.error(`  • ${error}\n`);
    });
    console.error(
      "Please add these variables to your .env.local file before running the application.\n"
    );
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn("\n⚠️  OPTIONAL ENVIRONMENT VARIABLES NOT SET\n");
    validation.warnings.forEach((warning) => {
      console.warn(`  • ${warning}\n`);
    });
  }

  console.log("✓ Environment validation passed");
}
