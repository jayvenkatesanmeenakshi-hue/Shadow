/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Mission } from '../types';
import { FOCUS_PROMPTS } from '../constants';
import { ChessAnalysis } from './ChessAnalysis';

interface FocusModeProps {
  mission: Mission;
  chessUsername?: string;
  onClose: () => void;
  onComplete: () => void;
}

export function FocusMode({ mission, chessUsername, onClose, onComplete }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(mission.durationMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    const prompts = FOCUS_PROMPTS[mission.category] || FOCUS_PROMPTS['Focus'];
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [mission]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (mission.durationMinutes * 60);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center overflow-auto"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-shadow-muted hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      <div className="max-w-md w-full bg-gradient-to-b from-shadow-card to-black border border-shadow-border p-12 flex flex-col items-center justify-center text-center rounded-sm">
        <div className="mb-10 w-full">
          <p className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted mb-6">Focus Module: {mission.category.toUpperCase()}</p>
          <div className="text-7xl font-light font-mono tracking-tighter text-white tabular-nums mb-4">
            {formatTime(timeLeft)}
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full bg-shadow-accent ${progress > i / 3 ? 'opacity-100' : 'opacity-20'}`} 
              />
            ))}
          </div>
        </div>

        <div className="w-full space-y-8 text-left">
          {mission.category === 'Gaming' && chessUsername ? (
            <ChessAnalysis username={chessUsername} />
          ) : (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-shadow-muted mb-4 border-b border-shadow-border pb-1">Analysis Prompts</p>
              <ul className="text-xs space-y-4 text-zinc-400">
                {(FOCUS_PROMPTS[mission.category] || FOCUS_PROMPTS['Focus']).slice(0, 2).map((prompt, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-shadow-accent italic">0{i+1}.</span> {prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="relative w-full">
            <p className="text-[10px] uppercase tracking-widest text-shadow-muted mb-2">Tactical Observations</p>
            <textarea 
              placeholder="Record tactical data here..."
              className="w-full bg-transparent border border-shadow-border p-3 text-xs text-shadow-muted h-32 focus:outline-none focus:border-shadow-accent resize-none rounded-sm transition-colors"
            />
            <div className="absolute bottom-2 right-2 text-[8px] uppercase text-shadow-muted/50 font-mono">Encrypted Connection</div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 w-full">
          <button 
            onClick={() => setIsActive(!isActive)}
            className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase border border-shadow-border hover:bg-shadow-bg transition-colors rounded-sm text-shadow-text"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>
          
          <button 
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase bg-shadow-accent text-white rounded-sm hover:brightness-110 transition-all"
          >
            Complete
          </button>
        </div>
      </div>

      <footer className="mt-8 flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] text-shadow-muted uppercase tracking-tighter">Stay sharp, Shadow.</p>
        <p className="text-[10px] text-shadow-muted font-mono uppercase tracking-tighter">Mission Unit {mission.id.split('-').pop()}</p>
      </footer>
    </motion.div>
  );
}
