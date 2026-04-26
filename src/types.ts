/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mission {
  id: string;
  name: string;
  timeRange: string;
  durationMinutes: number;
  category: 'Warmup' | 'Analysis' | 'Focus' | 'Social' | 'Reflection' | 'Gaming';
  isCompleted: boolean;
  notes: string;
  startTime?: string; // ISO string
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  badges: string[];
  completedCount: number;
  categories: {
    logic: number;
    observation: number;
    strategy: number;
    discipline: number;
  };
  chessUsername?: string;
}

export const LEVELS = [
  'Beginner',
  'Observer',
  'Analyst',
  'Strategist',
  'Elite',
  'Shadow'
];

export const XP_PER_LEVEL = 500;

export const BADGES = [
  { id: 'streak_3', name: 'Persistent Shadow', description: 'Maintain a 3-day streak', threshold: 3 },
  { id: 'streak_7', name: 'Shadow Awakened', description: 'Maintain a 7-day streak', threshold: 7 },
  { id: 'streak_30', name: 'Master Deduction', description: 'Maintain a 30-day streak', threshold: 30 }
];

export interface JournalTopic {
  id: string;
  userId: string;
  name: string;
  createdAt: any;
}

export interface JournalEntry {
  id: string;
  topicId: string;
  userId: string;
  date: string;
  deductions: string;
  updatedAt: any;
}

export interface IntelligenceReport {
  analysis: string;
  percentile: number;
  updatedAt: any;
}
