/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission } from './types';

export const DEFAULT_MISSIONS: Omit<Mission, 'id' | 'isCompleted' | 'notes'>[] = [
  {
    name: 'Brain Warmup',
    timeRange: '06:40–06:50',
    durationMinutes: 10,
    category: 'Warmup',
  },
  {
    name: 'Anime Analysis',
    timeRange: '14:30–15:30',
    durationMinutes: 60,
    category: 'Analysis',
  },
  {
    name: 'Gaming Session',
    timeRange: '16:00–16:30',
    durationMinutes: 30,
    category: 'Gaming',
  },
  {
    name: 'Focus Block',
    timeRange: '16:30–17:00',
    durationMinutes: 30,
    category: 'Focus',
  },
  {
    name: 'Badminton Analysis',
    timeRange: '19:00–19:10',
    durationMinutes: 10,
    category: 'Analysis',
  },
  {
    name: 'Night Reflection',
    timeRange: '21:00–21:15',
    durationMinutes: 15,
    category: 'Reflection',
  },
];

export const FOCUS_ROTATION = [
  'Logic Puzzles',       // Monday (0)
  'Crime Case Analysis', // Tuesday (1)
  'Psychology',          // Wednesday (2)
  'Chess Strategy',      // Thursday (3)
  'Cyber Basics',        // Friday (4)
  'Strategic Review',    // Saturday (5)
  'Pattern Recognition', // Sunday (6)
];

export const FOCUS_PROMPTS: Record<string, string[]> = {
  Gaming: [
    'Why did I win/lose?',
    'What pattern did I notice?',
    'One tactical error I made?',
  ],
  Analysis: [
    'Key clue discovered?',
    'What was misleading?',
    'One prediction for the next step?',
  ],
  Focus: [
    'Am I seeing the full picture?',
    'What is the core logic here?',
    'Identify one inconsistency.',
  ],
  Warmup: [
    'System status: Optimized?',
    'Mental fog level today?',
    'First task priority?',
  ],
};
