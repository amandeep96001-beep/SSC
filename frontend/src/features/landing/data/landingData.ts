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
    subtitle: 'Tables, squares and fraction recall',
    description: 'Multiplication tables up to 50, fraction-to-percentage conversions, squares & cubes, and roots. 5-minute timed micro-bursts.',
    tag: 'Calculation Edge',
    tagType: 'brand',
    icon: Zap,
    gridClass: 'bento-col-2',
  },
  {
    id: 'mock-simulation',
    title: 'Timed mock practice',
    subtitle: 'Palette, timer and negative marking',
    description: 'Sectional timers, question palette (Answered, Not Answered, Marked for Review), and negative marking penalties built to eliminate exam panic.',
    tag: 'Full Mock Engine',
    tagType: 'cyan',
    icon: ClipboardCheck,
    gridClass: 'bento-col-1',
  },
  {
    id: 'error-diagnostics',
    title: 'Root-Cause Error Diagnostics',
    subtitle: 'Fix why you got it wrong, not just what was right',
    description: 'Every wrong MCQ is automatically categorized into Conceptual Gap, Calculation Slip, or Time Panic with actionable memory hooks.',
    tag: 'Diagnostic Intelligence',
    tagType: 'rose',
    icon: BrainCircuit,
    gridClass: 'bento-col-1',
  },
  {
    id: 'syllabus-reader',
    title: 'Curated Syllabus & Structured Notes',
    subtitle: 'Official roadmap with topic-level tests',
    description: 'High-yield notes for Indian History, Polity, Geography, Science, and Arithmetic. Built-in bookmarking, focus mode, and instant revision decks.',
    tag: 'Full Syllabus',
    tagType: 'accent',
    icon: BookOpen,
    gridClass: 'bento-col-2',
  },
];

export const STATS_HIGHLIGHTS = [
  { value: 'SSC', label: 'Primary target', caption: 'CGL, CHSL, GD, CPO, MTS' },
  { value: 'Notice', label: 'Pattern from official sources', caption: 'ssc.gov.in / RRB CEN' },
  { value: 'Practice', label: 'Topic, PYQ, mock', caption: 'Attempt inside the app' },
  { value: 'Railway', label: 'Separate exam, overlapping subjects', caption: 'Not the same syllabus' },
];

export const STUDY_LOOP_STEPS = [
  {
    step: '01',
    title: 'Topic practice',
    time: 'Daily',
    description: 'Pick one topic and solve its questions. Use calculation drills when Quant is slow.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Notes + short test',
    time: 'Next',
    description: 'Read the syllabus notes, then take a short test on the same topic. Do not move on after highlighting alone.',
    icon: BookOpen,
  },
  {
    step: '03',
    title: 'Mock, then weak topics',
    time: 'After a full round',
    description: 'Sit a full timed paper. Review wrong questions with the score, and revise those topics the next day.',
    icon: ClipboardCheck,
  },
];

export const FAQ_LIST: FaqItem[] = [
  {
    category: 'Exams',
    question: 'How should I start SSC CGL preparation?',
    answer:
      'Read the CGL 2026 notice for the Tier-I and Tier-II pattern first. A Bachelor’s degree is the basic qualification; some posts ask for a subject-specific degree. Then split Quant, Reasoning, English and GA into topics and practise. Tier-I has 100 questions, 60 minutes, and a 15-minute sectional timer on each subject.',
  },
  {
    category: 'Syllabus',
    question: 'What is the SSC CGL syllabus?',
    answer:
      'Tier-I: Reasoning, General Awareness, Quantitative Aptitude, English Comprehension — 25 questions each. Tier-II Paper-I covers Maths, Reasoning, English, GA, Computer Knowledge and qualifying DEST. Statistics (Paper-II) and Finance & Economics (Paper-III) are only for notified posts. Source: SSC CGL 2026 notice.',
  },
  {
    category: 'Exams',
    question: 'What are Tier-I and Tier-II in SSC CGL?',
    answer:
      'Tier-I is the first CBT, 200 marks, used to shortlist. In Tier-II, Paper-I is compulsory for all posts. Its sections must be qualified separately. Paper-II and Paper-III are only for posts such as JSO / Statistical Investigator and AAO. Negative marking: −0.50 in Tier-I, −1 in the objective sections of Paper-I.',
  },
  {
    category: 'Exams',
    question: 'What is the SSC CHSL exam process?',
    answer:
      '10+2 level exam. After Tier-I (100 questions, 60 minutes, −0.50) comes Tier-II. Session-I covers Maths, Reasoning, English, GA and Computer. Session-II is a Skill Test for DEO and a Typing Test for LDC/JSA — both qualifying. Latest: SSC CHSL 2026 notice.',
  },
  {
    category: 'Syllabus',
    question: 'What should I study for SSC GD?',
    answer:
      'Matric-level CBE: Reasoning, GK, Elementary Maths, and English/Hindi — 20 questions each, 60 minutes, −0.25. Shortlisted candidates then take PET/PST, followed by medical and document verification. MCQs alone do not complete selection.',
  },
  {
    category: 'Syllabus',
    question: 'What is the Railway NTPC syllabus?',
    answer:
      'CEN 06/2024 (Under Graduate): CBT-1 is 100 questions / 90 minutes; CBT-2 is 120 questions / 90 minutes. Subjects: Mathematics, Reasoning, General Awareness. Negative marking 1/3. Typing is only for typist posts. This is not the same as the SSC CGL tier system.',
  },
  {
    category: 'Exams',
    question: 'What happens in Railway Group D / Level-1?',
    answer:
      'CEN 09/2025 starts with a CBT (100 questions, −1/3), then qualifying PET, then document verification and medical. Subjects include Maths, Reasoning, Class 10 General Science and Current Affairs / GA. Railway may also run a multi-stage CBT — read the CEN.',
  },
  {
    category: 'Exams',
    question: 'What is common between SSC and Railway preparation?',
    answer:
      'Quant, reasoning, general awareness and science overlap in many papers. English is often a separate SSC section; many RRB CBTs do not have it. The selection process, marks and qualifying stages are not the same.',
  },
  {
    category: 'Platform',
    question: 'Can I practise SSC and Railway from the same preparation?',
    answer:
      'You can practise common-subject questions here and build a base. Each exam still has its own form, syllabus weight and stages (typing, PET, CBAT, DEST). Do not treat one mock as the exact paper for both.',
  },
  {
    category: 'Platform',
    question: 'How does the app track my progress?',
    answer:
      'Each topic test is stored as Mastered, Reviewing or Needs work. The home screen then lists Strong topics and Needs attention. Full mocks save score, accuracy and time under Performance; Analytics shows the trend. Incorrect questions are queued in the Revision Deck. Sign in to keep this history — guest browsing does not save the same way. The app does not predict cut-off or selection.',
  },
  {
    category: 'Platform',
    question: 'Can I add my own questions?',
    answer:
      'Yes. In Daily Drills open Add Questions. You can submit a single MCQ or paste a JSON batch. Those questions go into the shared GK / English / Maths / Reasoning pool and show up in drills.',
  },
  {
    category: 'Platform',
    question: 'Can I make my own notes?',
    answer:
      'Yes. Quick notes live in the floating pad — a daily scratchpad you can pin and label. Topic notes sit on the Syllabus Roadmap: open a topic and save remarks there. Syllabus & Notes also has prepared chapter notes, with a topic test on the same page.',
  },
];
