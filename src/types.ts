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
  { id: 'streak-3', name: 'Consistent Mind', description: '3-day streak', threshold: 3 },
  { id: 'streak-7', name: 'Pattern Seeker', description: '7-day streak', threshold: 7 },
  { id: 'streak-30', name: 'Shadow Thinker', description: '30-day streak', threshold: 30 },
];
