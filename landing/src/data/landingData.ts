import type { ComponentType } from 'react';
import {
  Zap,
  BookOpen,
  ClipboardCheck,
  BrainCircuit,
  LineChart,
  PencilLine,
  PlusCircle,
  ListChecks,
  type LucideProps,
} from 'lucide-react';
import type { BentoFeature, FaqItem } from '../types/landing.types';

export interface AppWorkCard {
  id: string;
  title: string;
  text: string;
  points: string[];
  icon: ComponentType<LucideProps>;
}

export const APP_WORK_CARDS: AppWorkCard[] = [
  {
    id: 'practice',
    title: 'Practice questions',
    text: 'Pick a subject, open a topic, and attempt MCQs. That is the main loop.',
    points: [
      'Syllabus & Notes — chapter notes, then a topic test on the same page',
      'Daily Drills — short timed sets for speed math, GK, English and Reasoning',
      'Full Mocks — one sitting, timer, question palette, negative marking',
    ],
    icon: ListChecks,
  },
  {
    id: 'add-questions',
    title: 'Add your own questions',
    text: 'You can contribute MCQs, not only attempt the bank.',
    points: [
      'Open Daily Drills → Add Questions',
      'Submit one question through the form, or paste a JSON batch',
      'They go into the shared GK / English / Maths / Reasoning pool and appear in drills',
    ],
    icon: PlusCircle,
  },
  {
    id: 'notes',
    title: 'Make your own notes',
    text: 'Two kinds of notes — do not mix them up.',
    points: [
      'Quick notes — the floating pad is a daily scratchpad: write, pin, label, colour',
      'Topic notes — on Syllabus Roadmap, open a topic and save remarks against that topic',
      'Syllabus & Notes also has prepared chapter notes with a topic test attached',
    ],
    icon: PencilLine,
  },
  {
    id: 'progress',
    title: 'How progress is tracked',
    text: 'Attempts are stored as results, not as a guessed rank or cut-off.',
    points: [
      'Topic tests are marked Mastered, Reviewing or Needs work',
      'Home lists Strong topics and Needs attention from those scores',
      'Mocks save score, accuracy and time in Performance; Analytics charts the trend',
      'Wrong answers go to the Revision Deck for the next session',
      'Sign in to keep this history. Guest mode lets you browse; it does not save the same way',
    ],
    icon: LineChart,
  },
];

export const PROGRESS_FLOW = [
  { step: '01', title: 'Attempt', text: 'Topic test, drill or mock' },
  { step: '02', title: 'Recorded', text: 'Score, time, correct vs wrong' },
  { step: '03', title: 'Sorted', text: 'Strong vs weak on Home' },
  { step: '04', title: 'Revise', text: 'Revision Deck and your notes' },
  { step: '05', title: 'Check again', text: 'Performance and Analytics' },
];

export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: 'speed-drills',
    title: 'Speed Calculation & Memory Drills',
    subtitle: 'Tables 1-50, squares, cubes & fraction recall',
    description: 'Multiplication tables up to 50, fraction-to-percentage conversions (1/7, 1/13, 1/17), squares up to 50 & cubes up to 30. 5-minute timed micro-bursts to finish Quant in 22 minutes.',
    tag: 'Calculation Edge',
    tagType: 'brand',
    icon: Zap,
    gridClass: 'bento-col-2',
  },
  {
    id: 'mock-simulation',
    title: '100% Real TCS CBT Mock Engine',
    subtitle: 'Exact exam screen, timer palette & negative marking',
    description: 'Sectional timers, question palette (Answered, Not Answered, Marked for Review), and official −0.50 negative marking penalty built to eliminate exam-day panic.',
    tag: 'Full Mock Engine',
    tagType: 'cyan',
    icon: ClipboardCheck,
    gridClass: 'bento-col-1',
  },
  {
    id: 'error-diagnostics',
    title: 'Smart Error Notebook & Revision Deck',
    subtitle: 'Fix why you got it wrong, not just what was right',
    description: 'Every wrong MCQ is automatically categorized into Conceptual Gap, Calculation Slip, or Time Panic. Re-attempt mistakes until you achieve 100% accuracy.',
    tag: 'Zero Negative Marks',
    tagType: 'rose',
    icon: BrainCircuit,
    gridClass: 'bento-col-1',
  },
  {
    id: 'syllabus-reader',
    title: 'Curated Syllabus & High-Yield Chapter Notes',
    subtitle: 'Official roadmap with topic-level diagnostic tests',
    description: 'Crisp notes for Ancient/Medieval/Modern History, Indian Polity Articles, Geography, Science, and Advance Maths with instant topic tests attached.',
    tag: 'Complete Syllabus',
    tagType: 'accent',
    icon: BookOpen,
    gridClass: 'bento-col-2',
  },
];

export const STATS_HIGHLIGHTS = [
  { value: '48,900+', label: 'Active Aspirants', caption: 'Practicing daily across India' },
  { value: '100% Free', label: 'Zero Paywall', caption: 'Full mocks, drills & notes' },
  { value: 'TCS Pattern', label: 'Latest Syllabus', caption: '2025-2026 verified blueprint' },
  { value: '35+ Marks', label: 'Average Score Boost', caption: 'Via speed math & revision decks' },
];

export const STUDY_LOOP_STEPS = [
  {
    step: '01',
    title: 'Daily Speed Drill',
    time: '5-10 Mins',
    description: 'Kickstart your day with 1-50 tables, squares, cubes & fraction drills to wire quick calculations into muscle memory.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Chapter Notes + Topic Test',
    time: '45 Mins',
    description: 'Read high-yield notes for one chapter on the Syllabus Roadmap and immediately solve 15 targeted MCQs to cement concepts.',
    icon: BookOpen,
  },
  {
    step: '03',
    title: 'Full TCS Mock + Error Review',
    time: '60 Mins',
    description: 'Attempt a full-length CBT mock under real test conditions. Send all wrong and skipped questions directly to the Revision Deck.',
    icon: ClipboardCheck,
  },
];

export const FAQ_LIST: FaqItem[] = [
  {
    category: 'Platform',
    question: 'Is CrackuEx mock test really 100% free with no hidden charges?',
    answer:
      'Yes, absolutely. All full-length TCS pattern mocks, speed math calculation drills (1-50 tables, squares, cubes, fractions), topic-wise tests, chapter notes, and error revision decks are 100% free. There are no paywalls, no "Pass Pro" locks, and no credit card requirements.',
  },
  {
    category: 'Exams',
    question: 'How should I start SSC CGL 2025/2026 preparation as a beginner?',
    answer:
      '1) Download the official SSC CGL notice to understand the Tier-1 (Screening: 100 Qs, 200 Marks, 60 Mins) and Tier-2 (Merit: 390 Marks + Qualifying Computer & DEST) pattern. 2) Break the 4 subjects (Quant, Reasoning, English, General Awareness) into topics. 3) Master calculation speed (tables 1-50, squares, fraction-to-%) to save 15 minutes in Quant. 4) Practice previous 10-year TCS PYQs topic-wise and give 2 mocks per week with error analysis.',
  },
  {
    category: 'Platform',
    question: 'How do Speed Math drills help me score higher in SSC CGL & CHSL?',
    answer:
      'In Tier-1, you get only 60 minutes for 100 questions (36 seconds per question!). Average candidates spend 50-60 seconds on Maths calculations and run out of time. Our daily speed drills train you on 1-50 multiplication tables, squares up to 50, cubes up to 30, and fraction-to-percentage conversions (e.g. 1/7 = 14.28%, 3/8 = 37.5%). This reduces your Quant solve time from 40 minutes to 22 minutes, giving you a 25-35 mark advantage.',
  },
  {
    category: 'Exams',
    question: 'What is the latest TCS pattern and negative marking for SSC CGL & CHSL?',
    answer:
      'In Tier-I (CGL & CHSL): 100 questions, 200 marks, 60 minutes duration. Negative marking is −0.50 marks for each incorrect response (0.25 of the question value). In Tier-II: Paper-I objective questions carry 3 marks each with −1 mark negative penalty (33.33% negative marking). High negative marks are the #1 reason aspirants miss cutoffs.',
  },
  {
    category: 'Exams',
    question: 'What is a safe raw score to clear SSC CGL Tier-1 cutoff for UR, OBC & EWS?',
    answer:
      'Based on recent cutoffs (145-153 for UR in high-competition shifts), a safe raw score is 150+ in moderate shifts and 140+ in tough shifts. After TCS normalization, this ensures comfortable qualification. For top posts like ASO in MEA, CSS, and Income Tax Inspector, target 160+ raw score in mocks.',
  },
  {
    category: 'Platform',
    question: 'How does the Revision Deck (Error Notebook) stop negative marking?',
    answer:
      'Whenever you get an MCQ wrong or mark it for review in a mock or topic test, it is automatically saved into your personal Revision Deck. You can filter mistakes by "Conceptual Gap", "Calculation Slip", or "Time Rush". Re-practicing only your mistakes ensures you never repeat them in the actual examination.',
  },
  {
    category: 'Syllabus',
    question: 'What is the subject-wise weightage for SSC CGL Tier-1?',
    answer:
      'Quant (25 Qs / 50 Marks): Arithmetic 45%, Advance Maths (Algebra, Geometry, Trigonometry, Mensuration) 45%, DI 10%. Reasoning (25 Qs / 50 Marks): Coding, Analogy, Series, Syllogism, Non-verbal. English (25 Qs / 50 Marks): Vocab (Synonyms/Antonyms/OWS/Idioms) 40%, Grammar 30%, Comprehension/Cloze Test 30%. GA (25 Qs / 50 Marks): Static GK 30%, Science 25%, Polity & History 25%, Current Affairs 20%.',
  },
  {
    category: 'Exams',
    question: 'What is the difference between SSC and Railway NTPC / Group D exams?',
    answer:
      'Quant, Reasoning, and General Awareness overlap heavily between SSC and Railway. However, Railway NTPC CBTs have NO English section and have a −1/3 negative marking scheme (compared to −1/4 in SSC Tier-1). Railway CBT-1 has 100 Qs in 90 minutes. You can build a solid concept base on our platform for both.',
  },
  {
    category: 'Platform',
    question: 'Can I practice in both Hindi and English (Bilingual)?',
    answer:
      'Yes, questions, explanations, and mock tests support both Hindi and English mediums, exactly like the official TCS examination screen toggle.',
  },
  {
    category: 'Platform',
    question: 'Can I add my own questions or custom question banks?',
    answer:
      'Yes! Open Daily Drills → Add Questions to contribute individual MCQs or upload JSON batches to your question pool. You can practice them in custom timed drills anytime.',
  },
  {
    category: 'Exams',
    question: 'How many months of Current Affairs should I cover for SSC exams?',
    answer:
      'TCS primarily asks Current Affairs from the last 8 to 10 months prior to the exam date, with maximum weightage on national schemes, sports awards, appointments, summits, and military exercises.',
  },
  {
    category: 'Platform',
    question: 'Do I need to download an app or create an account to start practicing?',
    answer:
      'No app install is needed! You can start practicing drills and mocks instantly on your phone or PC browser. Creating a free account allows you to save your progress, track topic mastery, and sync your Revision Deck across devices.',
  },
];
