import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// BETTER AUTH TABLES
// ============================================

export const user = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").notNull().primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").notNull().primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").notNull().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================
// YOUR APP TABLES
// ============================================

export const starAnswers = pgTable("star_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(), // ← Changed to reference Better Auth user
  competency: text("competency").notNull(),
  question: text("question").notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  fullAnswer: text("full_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(), // ← Changed to reference Better Auth user
  answerId: uuid("answer_id")
    .references(() => starAnswers.id)
    .notNull(),
  videoUrl: text("video_url").notNull(),
  audioUrl: text("audio_url"),
  thumbnailUrl: text("thumbnail_url"),
  transcript: text("transcript"),
  duration: integer("duration"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const sessionFeedback = pgTable("session_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => practiceSessions.id)
    .notNull(),
  contentFidelityScore: integer("content_fidelity_score").notNull(),
  pacing: text("pacing").notNull(),
  confidence: text("confidence").notNull(),
  suggestions: text("suggestions").notNull(), // JSON
  wordsMatched: integer("words_matched"),
  totalWords: integer("total_words"),
  keyPointsMissed: text("key_points_missed"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
