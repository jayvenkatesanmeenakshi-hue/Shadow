/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  LayoutDashboard, 
  BarChart3, 
  Settings as SettingsIcon,
  Search,
  Scan,
  Zap,
  Sword,
  LogIn,
  LogOut
} from 'lucide-react';
import { useShadowStore } from './hooks/useShadowStore';
import { MissionCard } from './components/MissionCard';
import { FocusMode } from './components/FocusMode';
import { StatsDashboard } from './components/StatsDashboard';
import { Mission } from './types';
import { useAuth } from './context/AuthContext';
import { signInWithGoogle, auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

type Tab = 'missions' | 'stats' | 'settings';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { stats, missions, completeMission, updateMissionNotes, setChessUsername, loading: storeLoading } = useShadowStore();
  const [activeTab, setActiveTab] = useState<Tab>('missions');
  const [activeFocusMission, setActiveFocusMission] = useState<Mission | null>(null);
  const [editingChessUser, setEditingChessUser] = useState(false);
  const [chessUserTemp, setChessUserTemp] = useState(stats.chessUsername || '');

  const isShadowModeUnlocked = stats.streak >= 7;
  const isSunday = new Date().getDay() === 0;

  const completionPercent = useMemo(() => {
    if (missions.length === 0) return 0;
    return (missions.filter(m => m.isCompleted).length / missions.length) * 100;
  }, [missions]);

  // Special Challenge
  const specialChallenge = useMemo(() => {
    const day = new Date().getDate();
    const challenges = [
      "Identify one inconsistency in your environment today.",
      "Spot 3 repeating patterns in your gaming/activity.",
      "Predict a conversation outcome before it reveals.",
      "Analyze a stranger's intent from 3 subtle cues.",
      "Find the flaw in an argument you heard today."
    ];
    return challenges[day % challenges.length];
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-shadow-bg flex items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <Terminal size={32} className="mx-auto text-shadow-muted animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted">Initializing Encrypted Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-shadow-bg flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-12 border border-shadow-border bg-shadow-card text-center space-y-8 rounded-sm"
        >
          <div className="w-16 h-16 bg-shadow-text text-shadow-bg rounded-sm flex items-center justify-center mx-auto mb-4">
            <Terminal size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-white mb-2">Shadow Entry Point</h1>
            <p className="text-xs text-shadow-muted uppercase tracking-widest leading-relaxed">Identity verification required to access tactical operations data.</p>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-shadow-accent text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-3"
          >
            <LogIn size={16} /> Authenticate Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex text-shadow-text p-4 md:p-8 font-sans selection:bg-shadow-accent selection:text-white ${isShadowModeUnlocked ? 'shadow-mode' : ''}`}>
      
      {/* Sidebar / Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:w-20 md:h-fit flex md:flex-col items-center gap-6 bg-shadow-card md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 rounded-sm border border-shadow-border md:border-none z-40">
        <div className="hidden md:flex flex-col items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-sm bg-shadow-text flex items-center justify-center text-shadow-bg">
            <Terminal size={24} />
          </div>
          <div className="text-[10px] font-mono font-bold text-shadow-muted uppercase tracking-tighter tracking-[0.2em]">CT.SYS</div>
        </div>

        <NavButton active={activeTab === 'missions'} onClick={() => setActiveTab('missions')} icon={LayoutDashboard} label="Missions" />
        <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3} label="Analysis" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={SettingsIcon} label="System" />
        
        <div className="md:mt-auto">
          <NavButton active={false} onClick={() => signOut(auth)} icon={LogOut} label="Disconnect" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto space-y-12 pb-24 md:pb-0">
        
        {/* Header Section */}
        <header className="flex justify-between items-end border-b border-shadow-border pb-6">
          <div>
            <h1 className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted mb-1">System Status: Active</h1>
            <p className="text-2xl font-light tracking-tight">You are <span className="text-white font-medium">Shadow</span>.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-shadow-muted mb-1">Current Date</p>
            <p className="text-lg font-mono tracking-tighter uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).replace(',', ' //')}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'missions' && (
            <motion.section 
              key="missions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Missions List Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-shadow-muted">Daily Operations</h2>
                <span className="text-[10px] px-2 py-0.5 border border-shadow-accent/50 text-shadow-accent rounded-full">
                  {missions.filter(m => !m.isCompleted).length} Pending
                </span>
              </div>

              {/* Missions List */}
              <div className="space-y-2">
                {missions.map((mission) => (
                  <MissionCard 
                    key={mission.id}
                    mission={mission}
                    onComplete={() => completeMission(mission.id)}
                    onStartFocus={() => setActiveFocusMission(mission)}
                    onUpdateNotes={(notes: string) => updateMissionNotes(mission.id, notes)}
                  />
                ))}
              </div>

              {/* Daily Progress Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 border border-shadow-border rounded-sm bg-shadow-card/30">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-shadow-accent/50 mb-2">Special Intelligence Challenge</p>
                  <p className="text-xs leading-relaxed text-shadow-muted">{specialChallenge}</p>
                </div>

                {isSunday && (
                  <div className="p-4 border border-red-900/30 rounded-sm bg-red-950/10">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <Sword size={12} />
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Weekly Boss Mission</span>
                    </div>
                    <p className="text-xs text-shadow-muted">Critical Event: Full Case Analysis Challenge in progress.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {activeTab === 'stats' && (
            <motion.section 
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StatsDashboard stats={stats} />
            </motion.section>
          )}

          {activeTab === 'settings' && (
            <motion.section 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="p-8 border border-shadow-border rounded-sm bg-shadow-card/30 text-center space-y-8">
                <div>
                  <div className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest mb-4">Protocol Intelligence</div>
                  <h3 className="text-xl text-shadow-text font-light tracking-tight">System Preferences</h3>
                  <p className="text-xs text-shadow-muted max-w-sm mx-auto uppercase tracking-tighter">Adjust your neural feedback parameters.</p>
                </div>
                
                <div className="pt-6 flex flex-col gap-3 max-w-xs mx-auto">
                  <SettingToggle label="Haptic Feedback" enabled />
                  <SettingToggle label="Minimalist Transitions" enabled={isShadowModeUnlocked} />
                  <SettingToggle label="Focus Silence Mode" enabled />
                </div>

                <div className="pt-8 border-t border-shadow-border">
                  <div className="text-[10px] font-mono text-shadow-muted uppercase tracking-widest mb-4">External Synchronizations</div>
                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="p-4 border border-shadow-border bg-black/20 rounded-sm text-left">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-tighter">Chess.com Link</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${stats.chessUsername ? 'bg-shadow-accent/20 text-shadow-accent' : 'bg-shadow-muted/20 text-shadow-muted'}`}>
                          {stats.chessUsername ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>
                      
                      {editingChessUser ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="bg-transparent border-b border-shadow-accent text-xs p-1 focus:outline-none w-full"
                            placeholder="Enter Username"
                            value={chessUserTemp}
                            onChange={(e) => setChessUserTemp(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (setChessUsername(chessUserTemp), setEditingChessUser(false))}
                          />
                          <button onClick={() => { setChessUsername(chessUserTemp); setEditingChessUser(false); }} className="text-[10px] uppercase text-shadow-accent font-bold">Safe</button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-shadow-text">{stats.chessUsername || 'Not Configured'}</span>
                          <button onClick={() => { setChessUserTemp(stats.chessUsername || ''); setEditingChessUser(true); }} className="text-[10px] uppercase text-shadow-muted hover:text-white transition-colors">Adjust</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {activeFocusMission && (
          <FocusMode 
            mission={activeFocusMission} 
            chessUsername={stats.chessUsername}
            onClose={() => setActiveFocusMission(null)}
            onComplete={() => completeMission(activeFocusMission.id)}
          />
        )}
      </AnimatePresence>

      <footer className="fixed bottom-6 right-8 hidden md:block">
        <div className="flex items-center gap-3 text-shadow-muted opacity-30">
          <Scan size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Encrypted Session</span>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-3 rounded-sm transition-all border ${active ? 'bg-shadow-card border-shadow-accent/50 text-shadow-accent' : 'border-transparent text-shadow-muted hover:text-shadow-text'}`}
    >
      <Icon size={20} />
      <span className="absolute left-full ml-4 px-2 py-1 bg-shadow-card text-shadow-text text-[10px] font-mono uppercase tracking-widest border border-shadow-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
        {label}
      </span>
    </button>
  );
}

function SettingToggle({ label, enabled }: { label: string, enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-shadow-bg/50 border border-shadow-border rounded-sm">
      <span className="text-[10px] uppercase tracking-widest text-shadow-muted">{label}</span>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${enabled ? 'bg-shadow-accent' : 'bg-shadow-border'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${enabled ? 'right-0.5 bg-shadow-bg' : 'left-0.5 bg-shadow-muted'}`} />
      </div>
    </div>
  );
}
