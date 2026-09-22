import type { AppUser } from '@/types/app';

/** Fake sample history so guests see how Performance / Analytics look. */
export function buildDemoUser(examId = 'ssc'): AppUser {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(10 + (n % 5), 15, 0, 0);
    return d.toISOString();
  };

  return {
    username: 'you',
    displayName: 'You',
    progress: [
      {
        topicId: 'percentage',
        examId,
        subjectName: 'Quantitative Aptitude',
        score: 42,
        maxScore: 50,
        status: 'green',
        elapsedTime: '14 Mins',
        attemptNumber: 2,
        timestamp: daysAgo(1),
      },
      {
        topicId: 'synonyms',
        examId,
        subjectName: 'English',
        score: 31,
        maxScore: 50,
        status: 'yellow',
        elapsedTime: '18 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(2),
      },
      {
        topicId: 'blood-relation',
        examId,
        subjectName: 'Reasoning',
        score: 22,
        maxScore: 50,
        status: 'red',
        elapsedTime: '21 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(3),
      },
      {
        topicId: 'indian-polity',
        examId,
        subjectName: 'GK',
        score: 38,
        maxScore: 50,
        status: 'green',
        elapsedTime: '16 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(5),
      },
    ],
    mockProgress: [
      {
        mockTestId: 'demo-mock-1',
        examId,
        title: 'Tier-1 Full Mock · Sample',
        score: 128,
        correct: 72,
        wrong: 18,
        blank: 10,
        accuracy: 72,
        elapsedTime: '58 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(1),
      },
      {
        mockTestId: 'demo-mock-2',
        examId,
        title: 'Tier-1 Full Mock · Sample 2',
        score: 142,
        correct: 78,
        wrong: 14,
        blank: 8,
        accuracy: 78,
        elapsedTime: '55 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(4),
      },
      {
        mockTestId: 'demo-mock-3',
        examId,
        title: 'Previous Year Style',
        score: 118,
        correct: 66,
        wrong: 22,
        blank: 12,
        accuracy: 66,
        elapsedTime: '59 Mins',
        attemptNumber: 1,
        timestamp: daysAgo(6),
      },
    ],
  };
}
