import { queryOptions } from '@tanstack/react-query';

export const queryKeys = {
  files: {
    byUser: (userId: string) => ['files', userId] as const,
  },
  answers: {
    byUser: (userId: string) => ['answers', userId] as const,
  },
  practiceSessions: {
    byUser: (userId: string) => ['practiceSessions', userId] as const,
    byId: (sessionId: string) => ['practiceSession', sessionId] as const,
  },
};

export const userAnswersQueryOptions = (trpc: any, userId: string, enabled: boolean) => {
  return queryOptions({
    queryKey: queryKeys.answers.byUser(userId),
    queryFn: () => trpc.answers.getUserAnswers.query({ userId }),
    enabled,
  });
};

export const userPracticeSessionsQueryOptions = (trpc: any, userId: string, enabled: boolean) => {
  return queryOptions({
    queryKey: queryKeys.practiceSessions.byUser(userId),
    queryFn: () => trpc.practiceSessions.getUserPracticeSessions.query({ userId }),
    enabled,
  });
};

export const practiceSessionQueryOptions = (trpc: any, sessionId: string) => {
  return queryOptions({
    queryKey: queryKeys.practiceSessions.byId(sessionId),
    queryFn: () => trpc.practiceSessions.getPracticeSession.query({ sessionId }),
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });
};
