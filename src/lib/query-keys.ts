// Tanstack Query key factory
export const queryKeys = {
  files: {
    all: () => ["files"] as const,
    byUser: (userId: string) => ["files", "byUser", userId] as const,
  },
} as const;
