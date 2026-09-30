import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export interface ExamDetail {
  id: string;
  name: string;
  badge: string;
  description: string;
  stats: { label: string; value: string }[];
  subjects: string[];
  stages: string[];
  source?: { label: string; url: string };
}

export interface BentoFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  tagType: 'brand' | 'accent' | 'emerald' | 'cyan' | 'rose';
  icon: ComponentType<LucideProps>;
  gridClass: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'Platform' | 'Exams' | 'Syllabus';
}

export interface LandingProps {
  onGoToDashboard: () => void;
}
