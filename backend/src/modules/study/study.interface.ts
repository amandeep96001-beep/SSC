import type { Types } from 'mongoose';

export interface ISubject {
  name: string;
  ownerId?: string | null;
}

export interface ITopic {
  id: string;
  subjectName: string;
  name: string;
  syllabus?: string;
  notes?: string;
  ownerId?: string | null;
}

export interface IQuestion {
  topicId: string;
  q: string;
  o: string[];
  a: number;
  e: string;
  state?: string;
}

export type VocabCategory =
  | 'Word Power'
  | 'Idioms & Phrases'
  | 'One Word Substitution'
  | 'Spelling Rules';

export interface IVocab {
  word: string;
  pos?: string;
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
  options?: string[];
  category: VocabCategory | string;
  isImportant?: boolean;
  createdBy?: string;
}

export interface TopicQuestionInsert {
  topicId: string;
  q: string;
  o: string[];
  a: number;
  e: string;
  state?: string;
}

export type VocabPromptKind =
  | 'idiom-meaning'
  | 'ows-word'
  | 'wp-meaning'
  | 'wp-synonym'
  | 'wp-antonym';

export type VocabLean = IVocab & { _id: Types.ObjectId };

export interface VocabMcq {
  _id: string;
  promptKind: VocabPromptKind;
  question: string;
  options: string[];
  correctAnswer: string;
  isIdiom: boolean;
  word: string;
  revealDefinition: string;
  revealSynonyms: string[];
  revealAntonyms: string[];
  pos?: string;
  category: string;
}
