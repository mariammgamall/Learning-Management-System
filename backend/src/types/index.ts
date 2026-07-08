// Dual representation: runtime constant object + type declaration
export const Role = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  TA: 'TA',
  STUDENT: 'STUDENT',
} as const;
export type Role = typeof Role[keyof typeof Role];

export const FileType = {
  VIDEO: 'VIDEO',
  PDF: 'PDF',
  SLIDES: 'SLIDES',
  OTHER: 'OTHER',
} as const;
export type FileType = typeof FileType[keyof typeof FileType];

export const QuestionType = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
} as const;
export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export const ResultVisibility = {
  IMMEDIATE: 'IMMEDIATE',
  AFTER_DEADLINE: 'AFTER_DEADLINE',
} as const;
export type ResultVisibility = typeof ResultVisibility[keyof typeof ResultVisibility];
