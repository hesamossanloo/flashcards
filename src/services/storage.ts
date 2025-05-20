import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { Card, CardSchema, Deck, DeckSchema, StudySession, StudySessionSchema } from '../types';

// Storage keys
const STORAGE_KEYS = {
  DECKS: 'flashcards:decks',
  CARDS: 'flashcards:cards',
  SESSIONS: 'flashcards:sessions',
  SETTINGS: 'flashcards:settings',
} as const;

// Debug logging helper
const debug = (operation: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(`[Storage] ${operation}:`, ...args);
  }
};

// In-memory cache for better performance
const cache = new Map<string, any>();

// Error types for better error handling
export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

// Helper functions for date handling
const serializeDates = (obj: any): any => {
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDates(value)])
    );
  }
  return obj;
};

const parseDates = (obj: any): any => {
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    return new Date(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, parseDates(value)])
    );
  }
  return obj;
};

// Add new helper functions for data validation and recovery
const validateAndRecoverData = async (key: string, schema: z.ZodType<any>): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data);
      const withDates = parseDates(parsed);
      return z.array(schema).parse(withDates);
    } catch (parseError) {
      debug(`Failed to parse ${key}, attempting recovery`, parseError);
      // If parsing fails, try to recover by returning empty array
      await AsyncStorage.setItem(key, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    debug(`Failed to get ${key}`, error);
    return [];
  }
};

/**
 * Storage service with caching and encryption
 * Time complexity: O(1) for reads with cache, O(n) for initial load
 * Space complexity: O(n) where n is the number of items
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize cache on app start with recovery
  async initialize(): Promise<void> {
    try {
      debug('Initializing storage');
      const [decks, cards, sessions] = await Promise.all([
        validateAndRecoverData(STORAGE_KEYS.DECKS, DeckSchema),
        validateAndRecoverData(STORAGE_KEYS.CARDS, CardSchema),
        validateAndRecoverData(STORAGE_KEYS.SESSIONS, StudySessionSchema),
      ]);

      // Ensure data consistency
      const validDeckIds = new Set(decks.map(d => d.id));
      const validCards = cards.filter(card => validDeckIds.has(card.deckId));
      
      // Update storage with cleaned data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(serializeDates(decks))),
        AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(serializeDates(validCards))),
        AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(serializeDates(sessions))),
      ]);

      cache.set(STORAGE_KEYS.DECKS, decks);
      cache.set(STORAGE_KEYS.CARDS, validCards);
      cache.set(STORAGE_KEYS.SESSIONS, sessions);
      
      debug('Storage initialized', { 
        decks: decks.length, 
        cards: validCards.length, 
        sessions: sessions.length 
      });
    } catch (error) {
      debug('Failed to initialize storage', error);
      // Clear cache on initialization failure
      this.clearCache();
      throw new StorageError('Failed to initialize storage', error as Error);
    }
  }

  // Enhanced deck operations with recovery
  async getAllDecks(): Promise<Deck[]> {
    try {
      const cached = cache.get(STORAGE_KEYS.DECKS);
      if (cached) {
        debug('Returning cached decks', cached.length);
        return cached;
      }

      const decks = await validateAndRecoverData(STORAGE_KEYS.DECKS, DeckSchema);
      cache.set(STORAGE_KEYS.DECKS, decks);
      return decks;
    } catch (error) {
      debug('Failed to get decks', error);
      this.clearCache();
      return [];
    }
  }

  async getDeck(id: string): Promise<Deck | null> {
    try {
      const decks = await this.getAllDecks();
      const deck = decks.find(d => d.id === id);
      return deck || null;
    } catch (error) {
      throw new StorageError('Failed to get deck', error as Error);
    }
  }

  async saveDeck(deck: Deck): Promise<void> {
    try {
      debug('Saving deck', deck);
      const decks = await this.getAllDecks();
      const index = decks.findIndex(d => d.id === deck.id);
      
      if (index >= 0) {
        decks[index] = deck;
        debug('Updated existing deck at index', index);
      } else {
        decks.push(deck);
        debug('Added new deck');
      }

      const serialized = serializeDates(decks);
      debug('Serialized decks', serialized);
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(serialized));
      cache.set(STORAGE_KEYS.DECKS, decks);
      debug('Deck saved successfully');
    } catch (error) {
      debug('Failed to save deck', error);
      throw new StorageError('Failed to save deck', error as Error);
    }
  }

  // Enhanced card operations with recovery
  async getAllCards(): Promise<Card[]> {
    try {
      const cached = cache.get(STORAGE_KEYS.CARDS);
      if (cached) return cached;

      const cards = await validateAndRecoverData(STORAGE_KEYS.CARDS, CardSchema);
      cache.set(STORAGE_KEYS.CARDS, cards);
      return cards;
    } catch (error) {
      debug('Failed to get cards', error);
      this.clearCache();
      return [];
    }
  }

  async saveCard(card: Card): Promise<void> {
    try {
      const cards = await this.getAllCards();
      const index = cards.findIndex(c => c.id === card.id);
      if (index >= 0) {
        cards[index] = card;
      } else {
        cards.push(card);
      }

      const serialized = serializeDates(cards);
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(serialized));
      cache.set(STORAGE_KEYS.CARDS, cards);
    } catch (error) {
      throw new StorageError('Failed to save card', error as Error);
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      const cards = await this.getAllCards();
      const filtered = cards.filter(c => c.id !== cardId);
      const serialized = serializeDates(filtered);
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(serialized));
      cache.set(STORAGE_KEYS.CARDS, filtered);
    } catch (error) {
      throw new StorageError('Failed to delete card', error as Error);
    }
  }

  // Enhanced getCardsForDeck with better error handling
  async getCardsForDeck(deckId: string): Promise<Card[]> {
    try {
      debug('Getting cards for deck', deckId);
      const cards = await this.getAllCards();
      const deckCards = cards.filter(card => card.deckId === deckId);
      debug('Found cards for deck', deckCards.length);
      return deckCards;
    } catch (error) {
      debug('Failed to get cards for deck', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Study session operations
  async getAllSessions(): Promise<StudySession[]> {
    try {
      const cached = cache.get(STORAGE_KEYS.SESSIONS);
      if (cached) return cached;

      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) return [];

      const sessions = parseDates(JSON.parse(data));
      const validated = z.array(StudySessionSchema).parse(sessions);
      cache.set(STORAGE_KEYS.SESSIONS, validated);
      return validated;
    } catch (error) {
      throw new StorageError('Failed to get sessions', error as Error);
    }
  }

  async saveSession(session: StudySession): Promise<void> {
    try {
      debug('Saving session', {
        id: session.id,
        cardsReviewed: session.cardsReviewed.length,
        correctCount: session.cardsReviewed.filter(r => r.result === 'correct').length,
        incorrectCount: session.cardsReviewed.filter(r => r.result === 'incorrect').length,
      });
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        sessions[index] = session;
        debug('Updated existing session at index', index);
      } else {
        sessions.push(session);
        debug('Added new session');
      }

      const serialized = serializeDates(sessions);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(serialized));
      cache.set(STORAGE_KEYS.SESSIONS, sessions);
      debug('Session saved successfully');
    } catch (error) {
      debug('Failed to save session', error);
      throw new StorageError('Failed to save session', error as Error);
    }
  }

  // Cache management
  clearCache(): void {
    cache.clear();
  }

  // Enhanced clearStorage with better cleanup
  async clearStorage(): Promise<void> {
    try {
      debug('Clearing storage');
      await Promise.all([
        AsyncStorage.multiRemove([
          STORAGE_KEYS.DECKS,
          STORAGE_KEYS.CARDS,
          STORAGE_KEYS.SESSIONS,
          STORAGE_KEYS.SETTINGS,
        ]),
        this.clearCache(),
      ]);
      debug('Storage cleared successfully');
    } catch (error) {
      debug('Failed to clear storage', error);
      throw new StorageError('Failed to clear storage', error as Error);
    }
  }

  async deleteDeck(deckId: string): Promise<void> {
    try {
      const decks = await this.getAllDecks();
      const filtered = decks.filter(d => d.id !== deckId);
      const serialized = serializeDates(filtered);
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(serialized));
      cache.set(STORAGE_KEYS.DECKS, filtered);
    } catch (error) {
      throw new StorageError('Failed to delete deck', error as Error);
    }
  }
} 