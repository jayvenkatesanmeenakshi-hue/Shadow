/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ChessService, ChessGame } from '../services/ChessService';
import { ExternalLink, RefreshCw, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ChessAnalysisProps {
  username: string;
}

export function ChessAnalysis({ username }: ChessAnalysisProps) {
  const [games, setGames] = useState<ChessGame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = async () => {
    setLoading(true);
    // Prioritize current games, otherwise get recent ones
    const current = await ChessService.getCurrentGames(username);
    if (current.length > 0) {
      setGames(current);
    } else {
      const recent = await ChessService.getRecentGames(username);
      setGames(recent.slice(0, 1)); // Show most recent
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, [username]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <RefreshCw size={24} className="text-shadow-muted animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-shadow-muted">Syncing with Chess.com...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-shadow-border p-4 rounded-sm">
        <p className="text-xs text-shadow-muted uppercase tracking-tighter">No active or recent games found for {username}.</p>
      </div>
    );
  }

  const game = games[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-shadow-card p-4 border border-shadow-border rounded-sm">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-shadow-muted">Live Analysis Module</div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${game.end_time ? 'bg-shadow-muted' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-xs text-white font-medium">{game.end_time ? 'Recent Game' : 'Live Game'}</span>
             </div>
             <div className="text-[10px] font-mono text-shadow-muted">{game.time_control}</div>
          </div>
        </div>
        <button onClick={fetchGames} className="p-2 hover:bg-shadow-bg rounded-sm transition-colors text-shadow-muted">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PlayerCard player={game.white} color="white" />
        <PlayerCard player={game.black} color="black" />
      </div>

      <div className="p-4 border border-shadow-border bg-black/40 rounded-sm">
        <div className="text-[10px] uppercase tracking-widest text-shadow-muted mb-3">Tactical Prompts</div>
        <ul className="text-[10px] space-y-3 uppercase tracking-tighter text-shadow-text">
          <li className="flex gap-2"><span className="text-shadow-accent">01.</span> Analyze the current center control hierarchy.</li>
          <li className="flex gap-2"><span className="text-shadow-accent">02.</span> Identify the weakest link in your opponent's structure.</li>
          <li className="flex gap-2"><span className="text-shadow-accent">03.</span> Calculated risk: What is the most disruptive knight maneuver?</li>
        </ul>
      </div>

      <a 
        href={game.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 border border-shadow-border hover:bg-shadow-card text-[10px] uppercase font-bold tracking-widest transition-all rounded-sm text-shadow-text"
      >
        Open in Chess.com <ExternalLink size={12} />
      </a>
    </div>
  );
}

function PlayerCard({ player, color }: { player: { username: string, rating: number }, color: 'white' | 'black' }) {
  return (
    <div className={`p-3 border rounded-sm ${color === 'white' ? 'border-white/10 bg-white/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <User size={14} className={color === 'white' ? 'text-white' : 'text-zinc-500'} />
        <span className="text-[10px] font-mono text-shadow-muted">{player.rating}</span>
      </div>
      <div className={`text-xs font-medium tracking-tight truncate ${color === 'white' ? 'text-white' : 'text-zinc-400'}`}>
        {player.username}
      </div>
      <div className="text-[8px] uppercase tracking-widest text-shadow-muted mt-1">{color}</div>
    </div>
  );
}
