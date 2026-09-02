/**
 * Normalize answer format - converts letter-based answers (A, B, C, D) to numeric indices (0, 1, 2, 3)
 * Handles both formats gracefully
 */

export const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined) return null;
  
  // If already numeric index, return as-is
  if (typeof answer === 'number') return answer;
  
  // If string letter (A, B, C, D)
  if (typeof answer === 'string') {
    const upper = answer.toUpperCase().trim();
    if (upper === 'A') return 0;
    if (upper === 'B') return 1;
    if (upper === 'C') return 2;
    if (upper === 'D') return 3;
    
    const num = parseInt(answer, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 3) return num;
  }
  
  return null;
};

/**
 * Convert numeric index to letter (for display purposes)
 */
export const indexToLetter = (idx) => {
  if (idx === null || idx === undefined) return null;
  const letters = ['A', 'B', 'C', 'D'];
  return letters[idx] || null;
};

/**
 * Normalize entire question object for consistent handling
 */
export const normalizeQuestion = (question) => {
  return {
    ...question,
    a: normalizeAnswer(question.a)
  };
};

/**
 * Normalize array of questions
 */
export const normalizeQuestions = (questions) => {
  return (questions || []).map(normalizeQuestion);
};
