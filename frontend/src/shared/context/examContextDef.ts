import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { ExamProfile } from '@/types/app';

export interface StudyTarget {
  id: string;
  label: string;
  done: boolean;
  createdAt: number;
}

export interface ExamContextValue {
  examId: string;
  exam: ExamProfile;
  examDate: string;
  daysLeft: number | null;
  examSubjects: string[];
  subjectsByExam: Record<string, string[]>;
  onboarded: boolean;
  pickerOpen: boolean;
  setPickerOpen: Dispatch<SetStateAction<boolean>>;
  setExamId: (id: string) => void;
  setExamDate: (date: string) => void;
  targets: StudyTarget[];
  addTarget: (text: string) => void;
  toggleTarget: (id: string) => void;
  removeTarget: (id: string) => void;
  refreshExamConfigs: () => Promise<void>;
  saveExamSubjects: (
    id: string,
    subjects: string[]
  ) => Promise<{ success: boolean; message?: string }>;
  openExamPicker: () => void;
  closeExamPicker: () => void;
}

export const ExamContext = createContext<ExamContextValue | null>(null);
