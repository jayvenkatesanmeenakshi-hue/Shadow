/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Award, Zap, Target, Book, Brain, Shield } from 'lucide-react';
import { UserStats, LEVELS, XP_PER_LEVEL, BADGES } from '../types';

interface StatsDashboardProps {
  stats: UserStats;
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const currentLevelXp = stats.xp % XP_PER_LEVEL;
  const progressPercent = (currentLevelXp / XP_PER_LEVEL) * 100;

  // Kira (Light Yagami) Percentile Calculation
  const calculateKiraPercentile = () => {
    const totalCategoryScore = stats.categories.logic + stats.categories.observation + stats.categories.strategy + stats.categories.discipline;
    const levelScore = (stats.level / 6) * 100; // max level is 5 (0-indexed)
    const categoryScore = (totalCategoryScore / 80) * 100; 
    const streakScore = (stats.streak / 30) * 100;
    
    const percentile = (levelScore * 0.3 + categoryScore * 0.5 + streakScore * 0.2);
    return Math.min(percentile, 99.9).toFixed(1);
  };

  const kiraPercentile = calculateKiraPercentile();

  const categories = [
    { name: 'Logic', value: stats.categories.logic, icon: Brain, color: 'text-blue-400' },
    { name: 'Observation', value: stats.categories.observation, icon: Target, color: 'text-green-400' },
    { name: 'Strategy', value: stats.categories.strategy, icon: Zap, color: 'text-amber-400' },
    { name: 'Discipline', value: stats.categories.discipline, icon: Shield, color: 'text-zinc-400' },
  ];

  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <div className="flex items-end justify-between border-b border-shadow-border pb-6">
        <div>
          <div className="text-[10px] font-mono text-shadow-muted uppercase tracking-[0.4em] mb-2">Subject Identity</div>
          <h1 className="text-3xl font-light text-shadow-text flex items-center gap-3">
            Shadow <span className="text-shadow-muted font-mono text-sm tracking-tighter">[{LEVELS[stats.level].toUpperCase()}]</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest mb-1">Kira Percentile</div>
            <div className="text-2xl font-light text-shadow-accent">{kiraPercentile}%</div>
          </div>
          <div className="h-10 w-[1px] bg-shadow-border" />
          <div className="text-right">
            <div className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest mb-1">Active Streak</div>
            <div className="text-2xl font-light text-shadow-text">{stats.streak} <span className="text-xs text-shadow-muted">DAYS</span></div>
          </div>
        </div>
      </div>

      {/* Rank Progression */}
      <div className="bg-shadow-card border border-shadow-border p-5 rounded-sm">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-shadow-muted mb-4">Rank Progression</h2>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg tracking-tight font-light">{LEVELS[stats.level]}</span>
          <span className="text-[10px] font-mono text-shadow-accent">LVL {String(stats.level + 1).padStart(2, '0')}</span>
        </div>
        <div className="w-full h-[2px] bg-shadow-border mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-shadow-accent"
          />
        </div>
        <p className="text-[10px] text-shadow-muted uppercase tracking-tighter">{currentLevelXp} / {XP_PER_LEVEL} XP TO NEXT LEVEL</p>
      </div>

      {/* Category Grid */}
      <div>
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-shadow-muted mb-4">Skill Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {categories.map((c) => (
            <div key={c.name} className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-tighter text-shadow-text">
                <span className="flex items-center gap-2"><c.icon size={10} className="text-shadow-muted" />{c.name}</span>
                <span>{c.value}</span>
              </div>
              <div className="h-1 bg-shadow-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((c.value / 20) * 100, 100)}%` }}
                  className="h-full bg-shadow-text opacity-20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest flex items-center gap-2">
           Intelligence Medals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = stats.badges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={`p-4 border rounded-sm flex items-center gap-4 transition-all ${isUnlocked ? 'bg-shadow-card border-shadow-border' : 'bg-transparent border-dashed border-shadow-border opacity-20'}`}
              >
                <div className={`p-2 ${isUnlocked ? 'text-shadow-accent' : 'text-shadow-muted'}`}>
                  <Award size={20} />
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-tight ${isUnlocked ? 'text-shadow-text' : 'text-shadow-muted'}`}>{badge.name.toUpperCase()}</div>
                  <div className="text-[10px] text-shadow-muted uppercase tracking-tighter">{badge.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
