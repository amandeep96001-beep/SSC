import { useContext } from 'react';
import { ExamContext } from './examContextDef';

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return ctx;
}
