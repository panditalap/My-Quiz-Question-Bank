export type UserRole = 'admin' | 'contributor';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  subjectSpecialty?: string;
  createdAt: string;
  lastLoginAt: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOptions;
  correctOption: CorrectOption;
  subject: string;
  difficulty: Difficulty;
  tags: string[];
  referenceExplanation: string;
  contributorUid: string;
  contributorName: string;
  contributorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilters {
  searchQuery: string;
  subject: string;
  difficulty: string;
  tag: string;
  contributorUid: string;
  sortBy: 'newest' | 'oldest' | 'subject' | 'difficulty';
}

export type ExportFormat = 'csv' | 'json' | 'gift' | 'text';
