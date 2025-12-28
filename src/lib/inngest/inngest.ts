import { Inngest } from "inngest";

console.log('[Inngest] Initializing with INNGEST_KEY:', process.env.INNGEST_KEY ? 'SET' : 'NOT SET');
console.log('[Inngest] INNGEST_EVENT_KEY:', process.env.INNGEST_EVENT_KEY ? 'SET' : 'NOT SET');

export const inngest = new Inngest({
  id: "my-app",
});

console.log('[Inngest] Client initialized');
