import { apiService, type RequestOptions } from '@/shared/services/apiService';

export const drillApi = {
  next: (type: string, maxBase: number, opts?: RequestOptions & { guest?: boolean }) => {
    const base = opts?.guest ? '/drill/guest/next' : '/drill/next';
    return apiService.get(
      `${base}?type=${encodeURIComponent(type)}&maxBase=${encodeURIComponent(maxBase)}`,
      opts,
    );
  },

  verify: (
    body: { challengeToken: string; userAnswer: string },
    opts?: RequestOptions & { guest?: boolean },
  ) =>
    apiService.post(opts?.guest ? '/drill/guest/verify' : '/drill/verify', body, opts),

  related: (params: URLSearchParams, opts?: RequestOptions) =>
    apiService.get(`/drill/related?${params.toString()}`, opts),

  listWrongLog: (opts?: RequestOptions) =>
    apiService.get('/drill/wrong-log', opts),

  upsertWrongLog: (body: Record<string, unknown>, opts?: RequestOptions) =>
    apiService.post('/drill/wrong-log', body, opts),

  migrateWrongLog: (items: unknown[], opts?: RequestOptions) =>
    apiService.post('/drill/wrong-log/migrate', { items }, opts),

  removeWrongLog: (question: string, opts?: RequestOptions) =>
    apiService.delete(`/drill/wrong-log?question=${encodeURIComponent(question)}`, opts),

  clearWrongLog: (type?: string, opts?: RequestOptions) => {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiService.delete(`/drill/wrong-log${q}`, opts);
  },
};

export const competitionApi = {
  questions: (subject: string, limit: number, opts?: RequestOptions) =>
    apiService.get(
      `/competition/questions?subject=${encodeURIComponent(subject)}&limit=${limit}`,
      opts,
    ),

  submit: (
    body: {
      sessionToken: string;
      answers: Array<number | null>;
      timeTaken: number;
      subject?: string;
    },
    opts?: RequestOptions,
  ) => apiService.post('/competition/submit', body, opts),

  leaderboard: (subject: string, opts?: RequestOptions) =>
    apiService.get(`/competition/leaderboard?subject=${encodeURIComponent(subject)}`, opts),
};
