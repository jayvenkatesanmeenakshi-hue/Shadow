/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { Mission } from '../types';

interface MissionCardProps {
  mission: Mission;
  onComplete: () => void;
  onStartFocus: () => void;
  onUpdateNotes: (notes: string) => void;
}

export function MissionCard({ mission, onComplete, onStartFocus, onUpdateNotes }: MissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className={`group border bg-shadow-card rounded-sm overflow-hidden transition-all ${mission.isCompleted ? 'opacity-50 border-shadow-border' : 'border-shadow-accent/20 hover:border-shadow-accent/40'} ${!mission.isCompleted && isExpanded ? 'border-l-2 border-l-shadow-accent shadow-xl' : ''}`}
    >
      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <button 
          onClick={(e) => { e.stopPropagation(); if (!mission.isCompleted) onComplete(); }}
          className="flex-shrink-0"
        >
          {mission.isCompleted ? (
            <div className="w-4 h-4 bg-shadow-accent border border-shadow-accent flex items-center justify-center">
               <CheckCircle2 size={12} className="text-shadow-bg" strokeWidth={4} />
            </div>
          ) : (
            <div className="w-4 h-4 border border-shadow-muted group-hover:border-shadow-accent transition-colors" />
          )}
        </button>

        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${mission.isCompleted ? 'text-shadow-muted' : 'text-shadow-accent'}`}>
              {mission.timeRange}
            </span>
            {mission.isCompleted && <span className="text-[10px] text-shadow-muted font-mono tracking-tighter">COMPLETE</span>}
          </div>
          <h3 className={`text-sm tracking-tight transition-all font-light ${mission.isCompleted ? 'text-shadow-muted line-through' : 'text-shadow-text'}`}>
            {mission.name}
          </h3>
        </div>

        <div className="text-[10px] opacity-0 group-hover:opacity-100 uppercase tracking-widest text-shadow-muted transition-opacity hidden md:block">
          Focus &rarr;
        </div>
      </div>

      <motion.div 
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        className="overflow-hidden bg-shadow-bg/50"
      >
        <div className="p-4 space-y-4 border-t border-shadow-border">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest">
              Observations
            </label>
            <textarea 
              value={mission.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Record tactical data here..."
              className="w-full bg-transparent border border-shadow-border p-3 text-xs text-shadow-muted focus:outline-none focus:border-shadow-accent/50 min-h-[80px] resize-none"
            />
          </div>
          
          <button 
            onClick={onStartFocus}
            className="w-full py-2 bg-shadow-text text-shadow-bg font-bold uppercase tracking-tighter text-[10px] rounded-sm hover:bg-white transition-colors"
          >
            Enter {mission.category} Module
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
