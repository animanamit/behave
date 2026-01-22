// src/app/api/answers-stream/route.ts
import { getCurrentSession } from "@/lib/cached-auth";
import { db } from "@/db/prisma";
import { TIMEOUTS } from "@/lib/constants";

const POLL_INTERVAL_MS = TIMEOUTS.INNGEST_POLL_INTERVAL_MS;

type SSEPayload = {
  answers: {
    id: number;
    competency: string;
    question: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    fullAnswer: string | null;
  }[];
  count: number;
};

type UserChannel = {
  listeners: Set<(payload: SSEPayload) => void>;
  interval: NodeJS.Timeout | null;
  lastCount: number;
};

const userChannels = new Map<string, UserChannel>();

async function fetchAnswers(userId: string): Promise<SSEPayload["answers"]> {
  const answers = await db.starAnswer.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return answers.map((a, i) => ({
    id: i + 1,
    competency: a.competency,
    question: a.question,
    situation: a.situation,
    task: a.task,
    action: a.action,
    result: a.result,
    fullAnswer: a.fullAnswer,
  }));
}

function stopChannelIfIdle(userId: string) {
  const channel = userChannels.get(userId);
  if (!channel) return;
  if (channel.listeners.size === 0 && channel.interval) {
    clearInterval(channel.interval);
    channel.interval = null;
    userChannels.delete(userId);
  }
}

function ensureChannel(userId: string) {
  let channel = userChannels.get(userId);
  if (!channel) {
    channel = {
      listeners: new Set(),
      interval: null,
      lastCount: 0,
    };
    userChannels.set(userId, channel);
  }

  if (!channel.interval) {
    channel.interval = setInterval(async () => {
      try {
        const answers = await fetchAnswers(userId);
        const payload = { answers, count: answers.length };
        if (payload.count !== channel!.lastCount) {
          channel!.lastCount = payload.count;
          channel!.listeners.forEach((listener) => listener(payload));
        }
      } catch (error) {
        console.error("[SSE] Shared poller failed:", error);
      }
    }, POLL_INTERVAL_MS);
  }

  return channel;
}

/**
 * SERVER-SENT EVENTS (SSE) ENDPOINT
 *
 * This endpoint maintains a PERSISTENT HTTP CONNECTION and pushes updates
 * to the frontend in real-time whenever new answers are generated.
 *
 * NOTE ON DB PERSISTENCE:
 * Since we moved to a database (stateless), we can't use an in-memory event emitter
 * to notify this endpoint of changes from the Inngest function (which runs in a separate process).
 *
 * Instead, this endpoint now performs "Server-Side Polling":
 * 1. Checks the DB every 2 seconds
 * 2. If new answers appear, pushes them to the client
 *
 * This mimics real-time behavior for the client while using a standard DB.
 */
export async function GET(req: Request) {
  // Use cached auth for efficiency - see revisions.md
  const session = await getCurrentSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: any) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error(`[SSE] Error encoding message for event "${event}":`, error);
        }
      };

      // Send current snapshot immediately
      try {
        const initialAnswers = await fetchAnswers(userId);
        send("initial", {
          answers: initialAnswers,
          count: initialAnswers.length,
        });
        const channel = userChannels.get(userId);
        if (channel) {
          channel.lastCount = Math.max(channel.lastCount, initialAnswers.length);
        }
      } catch (error) {
        console.error("[SSE] Error fetching initial answers:", error);
      }

      // Register with shared poller
      const channel = ensureChannel(userId);
      const listener = (payload: SSEPayload) => send("update", payload);
      channel.listeners.add(listener);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          send("heartbeat", { timestamp: Date.now() });
        } catch (error) {
          console.error("[SSE] Heartbeat failed, cleaning up:", error);
          clearInterval(heartbeat);
          controller.close();
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        console.log(`[SSE] Client disconnected for user ${userId}`);
        clearInterval(heartbeat);
        channel.listeners.delete(listener);
        stopChannelIfIdle(userId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
