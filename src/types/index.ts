import { NavigatorScreenParams } from '@react-navigation/native';
import { z } from 'zod';

// Using Zod for runtime type validation and schema definition
export const CardSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),  // Reference to the parent deck
  front: z.string().min(1),
  back: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  // For spaced repetition algorithm
  level: z.number().int().min(0).default(0),
  nextReviewDate: z.date().optional(),
  // Performance tracking
  correctCount: z.number().int().min(0).default(0),
  incorrectCount: z.number().int().min(0).default(0),
  lastReviewed: z.date().optional(),
  // Tags for categorization and filtering
  tags: z.array(z.string()).default([]),
});

export const DeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().default(''),
  createdAt: z.date(),
  updatedAt: z.date(),
  // For study session tracking
  lastStudied: z.date().optional(),
  totalCards: z.number().int().min(0).default(0),
  // Performance metrics
  masteredCards: z.number().int().min(0).default(0),
  learningCards: z.number().int().min(0).default(0),
  // Customization
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const StudySessionSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date().optional(),
  // Track cards reviewed in this session
  cardsReviewed: z.array(z.object({
    cardId: z.string().uuid(),
    result: z.enum(['correct', 'incorrect']),
    timeSpent: z.number(), // milliseconds
  })),
});

// Derive TypeScript types from Zod schemas
export type Card = z.infer<typeof CardSchema>;
export type Deck = z.infer<typeof DeckSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;

// Enums for consistent string values
export enum StudyResult {
  Correct = 'correct',
  Incorrect = 'incorrect',
}

// Constants for spaced repetition
export const SR_INTERVALS = {
  LEVEL_0: 0, // Same day
  LEVEL_1: 1, // Next day
  LEVEL_2: 3, // 3 days
  LEVEL_3: 7, // 1 week
  LEVEL_4: 14, // 2 weeks
  LEVEL_5: 30, // 1 month
  LEVEL_6: 90, // 3 months
  LEVEL_7: 180, // 6 months
} as const;

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  lastReviewed?: Date;
  nextReview?: Date;
  difficulty?: number; // 1-5 scale
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  DeckDetail: { deckId: string };
  CardDetail: { deckId: string; cardId: string };
  CreateDeck: undefined;
  EditDeck: { deckId: string };
  Study: { deckId: string };
  AddCard: { deckId: string; isFirstCard: boolean };
  Stats: {
    sessionId: string;
    stats: {
      totalCards: number;
      correctCards: number;
      accuracy: number;
      totalTime: number;
      averageTimePerCard: number;
    };
  };
};

export type MainTabParamList = {
  Decks: undefined;
  Study: undefined;
  Stats: undefined;
  Settings: undefined;
};

export interface User {
  id: string;
  username: string;
  email: string;
  createdDecks: string[];
  savedDecks: string[];
  studyStats: {
    cardsReviewed: number;
    correctAnswers: number;
    studyTime: number;
  };
} 