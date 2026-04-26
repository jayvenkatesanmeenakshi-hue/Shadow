/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Timestamp,
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DetectiveCase } from '../types';
import { useShadowStore } from '../hooks/useShadowStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Terminal, 
  ShieldAlert, 
  Target, 
  Brain, 
  Lock, 
  CheckCircle2, 
  XSquare,
  Clock,
  ChevronRight,
  Send,
  FileText,
  Type,
  Bold,
  Italic,
  List,
  Save,
  ArrowLeft,
  CalendarDays,
  History,
  AlertCircle,
  Trash2
} from 'lucide-react';

// --- Countdown Hook ---
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const hourStr = hours.toString().padStart(2, '0');
      const minStr = mins.toString().padStart(2, '0');
      const secStr = secs.toString().padStart(2, '0');

      if (days > 0) {
        setTimeLeft(`${days}days, ${hourStr}:${minStr}:${secStr}`);
      } else {
        setTimeLeft(`${hourStr}:${minStr}:${secStr}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// --- Main Component ---
export function CaseSimulationHub() {
  const { user } = useAuth();
  const { createCase, submitCaseSolution, deleteCase } = useShadowStore();
  const [cases, setCases] = useState<DetectiveCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<DetectiveCase | null>(null);
  const [solution, setSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number, text: string } | null>(null);
  const [view, setView] = useState<'ops' | 'archive'>('ops');
  const [snapshotReceived, setSnapshotReceived] = useState(false);

  useEffect(() => {
    if (!user) return;
    const casesRef = collection(db, 'users', user.uid, 'cases');
    const q = query(
      casesRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCases(snapshot.docs.map(doc => doc.data() as DetectiveCase));
      setSnapshotReceived(true);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/cases`));

    return () => unsubscribe();
  }, [user]);

  const handleCreateCase = (type: 'daily' | 'weekly' | 'monthly') => {
    createCase(type);
  };

  const handleSubmit = async () => {
    if (!selectedCase || !solution.trim()) return;
    setIsSubmitting(true);
    const result = await submitCaseSolution(selectedCase.id, solution);
    if (result) {
      setEvaluation({ score: result.score, text: result.evaluation });
    }
    setIsSubmitting(false);
  };

  // --- Filtering Logic ---
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeCases = useMemo(() => {
    return cases.filter(c => {
      // Ensure timestamps are present before converting
      if (!c.createdAt || !c.expiresAt) return false;

      const created = (c.createdAt as Timestamp).toDate();
      const expires = (c.expiresAt as Timestamp).toDate();
      const isExpired = expires < new Date();
      
      if (c.type === 'daily') {
        created.setHours(0, 0, 0, 0);
        return created.getTime() === today.getTime() && c.status === 'available' && !isExpired;
      }
      if (c.type === 'weekly') {
        return c.status === 'available' && !isExpired;
      }
      if (c.type === 'monthly') {
        return c.status === 'available' && !isExpired;
      }
      return false;
    });
  }, [cases, today]);

  // Handle auto-expiration: if a case is past its deadline but still 'available', mark as failed
  useEffect(() => {
    if (!user || cases.length === 0) return;
    
    cases.forEach(async (c) => {
      if (c.status !== 'available') return;
      const expires = (c.expiresAt as Timestamp)?.toDate();
      if (expires && expires < new Date()) {
        try {
          const caseRef = doc(db, 'users', user.uid, 'cases', c.id);
          await updateDoc(caseRef, { 
            status: 'failed', 
            evaluation: 'PROTOCOL FAILURE: DEADLINE EXCEEDED. COGNITIVE PARAMETERS NOT MET.', 
            score: 0, 
            updatedAt: serverTimestamp() 
          });
        } catch (e) {
          console.error("Expiration sync failed for " + c.id, e);
        }
      }
    });
  }, [cases, user]);

  const solvedCases = useMemo(() => {
    return cases.filter(c => c.status === 'passed' || c.status === 'failed');
  }, [cases]);

  // --- Specialized Monthly Test Window logic (4th Sunday) ---
  const monthlyTestInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Calculate 4th Sunday
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    const fourthSunday = new Date(year, month, firstSunday + 21);
    
    const day = now.getDay();
    const hour = now.getHours();

    // Is it 4th Sunday today between 11:00 and 12:00?
    const isFourthSunday = now.getDate() === fourthSunday.getDate();
    const isTestWindow = isFourthSunday && day === 0 && hour === 11;
    
    const dateStr = fourthSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (isTestWindow) {
      const end = new Date(fourthSunday);
      end.setHours(12, 0, 0, 0);
      return { target: end, label: 'CLOSES AT', isReady: true, date: dateStr };
    } else {
      let targetDate = new Date(fourthSunday);
      if (now.getTime() > fourthSunday.getTime() && !isTestWindow) {
        // Next month
        const nextMonth = month + 1;
        const nextFirstDay = new Date(year, nextMonth > 11 ? 0 : nextMonth, 1).getDay();
        const nextFirstSunday = nextFirstDay === 0 ? 1 : 8 - nextFirstDay;
        targetDate = new Date(nextMonth > 11 ? year + 1 : year, nextMonth > 11 ? 0 : nextMonth, nextFirstSunday + 21);
      }
      targetDate.setHours(11, 0, 0, 0);
      
      return { target: targetDate, label: 'NEXT EVALUATION', isReady: false, date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    }
  }, [today]);

  const monthlyCountdown = useCountdown(monthlyTestInfo.target);

  // Auto-close monthly at 12:00 sharp
  useEffect(() => {
    if (selectedCase?.type === 'monthly' && monthlyCountdown === 'EXPIRED' && selectedCase.status === 'available') {
      setSelectedCase(null);
    }
  }, [monthlyCountdown, selectedCase]);

  // Daily countdown targets
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const dailyCountdown = useCountdown(midnight);

  // --- Auto-Generation Logic ---
  useEffect(() => {
    if (!user || !snapshotReceived) return;
    
    const hasDailyToday = cases.some(c => {
      if (!c.createdAt) return false;
      const created = (c.createdAt as Timestamp).toDate();
      return c.type === 'daily' && created.toDateString() === today.toDateString();
    });

    if (!hasDailyToday) {
      createCase('daily');
    }
    
    // Monthly auto-generation on 4th Sunday window
    if (monthlyTestInfo.isReady) {
      const hasMonthlyThisWindow = cases.some(c => {
        if (!c.createdAt) return false;
        const created = (c.createdAt as Timestamp).toDate();
        return c.type === 'monthly' && created.toDateString() === today.toDateString();
      });
      if (!hasMonthlyThisWindow) {
        createCase('monthly');
      }
    }
  }, [user, cases, monthlyTestInfo.isReady, today, snapshotReceived]);

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div 
            key="hub-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-end pb-4 border-b border-shadow-border">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-white">Ops Center: Simulation Hub</h2>
                <div className="flex items-center gap-6 mt-1">
                  <button 
                    onClick={() => setView('ops')}
                    className={`text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${view === 'ops' ? 'text-shadow-accent' : 'text-shadow-muted hover:text-white'}`}
                  >
                    <CalendarDays size={12} /> Active Operations
                  </button>
                  <button 
                    onClick={() => setView('archive')}
                    className={`text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${view === 'archive' ? 'text-shadow-accent' : 'text-shadow-muted hover:text-white'}`}
                  >
                    <History size={12} /> Solved Archives
                  </button>
                </div>
              </div>
            </div>

            {view === 'ops' ? (
              <div className="space-y-12">
                {/* Daily Cases Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-shadow-accent" />
                      <h3 className="text-[10px] uppercase tracking-widest text-white font-bold">Daily Protocol</h3>
                    </div>
                    <div className="text-[10px] text-shadow-muted font-mono flex items-center gap-2">
                      <Clock size={10} /> ROTATION IN: {dailyCountdown}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {activeCases.filter(c => c.type === 'daily').map(c => (
                      <BigCaseCard key={c.id} caseData={c} onClick={() => setSelectedCase(c)} onDelete={() => deleteCase(c.id)} />
                    ))}
                    
                    {activeCases.filter(c => c.type === 'daily').length === 0 && (
                      <div className="p-12 border border-dashed border-shadow-border rounded-sm flex flex-col items-center justify-center opacity-30">
                        <AlertCircle size={20} className="mb-2" />
                        <span className="text-[10px] uppercase tracking-widest">Awaiting Command Link...</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Specialized Cases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SpecialCaseSection 
                    title="Weekly Strategic Maneuver" 
                    cases={activeCases.filter(c => c.type === 'weekly')} 
                    icon={ShieldAlert}
                    onGenerate={() => handleCreateCase('weekly')}
                    onSelect={setSelectedCase}
                    onDelete={deleteCase}
                  />
                  <SpecialCaseSection 
                    title="Monthly High-Stakes Evaluation" 
                    cases={activeCases.filter(c => c.type === 'monthly')} 
                    icon={Target}
                    onGenerate={() => handleCreateCase('monthly')}
                    onSelect={setSelectedCase}
                    onDelete={deleteCase}
                    info={monthlyTestInfo}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[10px] uppercase tracking-widest text-shadow-muted mb-6">Historical Data Records</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {solvedCases.length > 0 ? solvedCases.map(c => (
                    <CaseCard key={c.id} caseData={c} onClick={() => setSelectedCase(c)} onDelete={() => deleteCase(c.id)} />
                  )) : (
                    <div className="col-span-full py-20 text-center border border-dashed border-shadow-border rounded-sm opacity-30">
                      <History size={32} className="mx-auto mb-4" />
                      <p className="text-xs">No records found in archive.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="split-screen-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Header */}
            <header className="h-14 border-b border-shadow-border flex justify-between items-center px-6 bg-shadow-background">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => { setSelectedCase(null); setEvaluation(null); setSolution(''); }}
                  className="flex items-center gap-2 text-shadow-muted hover:text-white transition-colors text-xs"
                >
                  <ArrowLeft size={16} /> EXIT SIMULATION
                </button>
                <div className="h-4 w-[1px] bg-shadow-border" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-shadow-accent uppercase tracking-widest font-bold">{selectedCase.type} OPERATION</span>
                  <span className="text-[10px] text-shadow-muted font-mono">ID: {selectedCase.id.slice(0, 12)}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {selectedCase.status === 'available' && (
                  <div className="flex items-center gap-2 bg-shadow-accent/10 px-3 py-1 border border-shadow-accent/20 rounded-sm">
                    <Clock size={12} className="text-shadow-accent" />
                    <span className="text-xs font-mono text-shadow-accent">
                      {selectedCase.type === 'monthly' ? `${monthlyTestInfo.label}: ${monthlyCountdown}` : `EXPIRES IN: ${dailyCountdown}`}
                    </span>
                  </div>
                )}
                {selectedCase.status === 'available' && (
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !solution.trim()}
                    className="bg-shadow-accent hover:brightness-110 text-white px-4 py-1.5 rounded-sm text-[10px] uppercase font-bold tracking-widest disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? <RefreshIcon /> : <><Send size={14} /> TRANSMIT REPORT</>}
                  </button>
                )}
              </div>
            </header>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Case Briefing */}
              <div className="w-1/2 overflow-y-auto p-12 border-r border-shadow-border space-y-12">
                <section className="space-y-4">
                  <h1 className="text-3xl font-light text-white tracking-tight leading-tight">
                    {selectedCase.title}
                  </h1>
                  <div className="flex gap-4">
                    <span className="text-[10px] text-shadow-muted border border-shadow-border px-2 py-0.5 rounded-sm uppercase tracking-widest">
                      Difficulty: {selectedCase.difficulty}
                    </span>
                    <span className="text-[10px] text-shadow-muted border border-shadow-border px-2 py-0.5 rounded-sm uppercase tracking-widest">
                      Intel Sect: {selectedCase.discipline}
                    </span>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-shadow-accent uppercase tracking-[0.4em] text-[10px] font-bold">
                    <AlertCircle size={14} /> Situational Briefing
                  </div>
                  <div className="bg-shadow-card/30 p-8 border-l border-shadow-accent rounded-r-sm italic opacity-90 text-sm leading-loose text-shadow-text">
                    "{selectedCase.scenario}"
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-shadow-accent uppercase tracking-[0.4em] text-[10px] font-bold">
                    <Search size={14} /> Intelligence Collated
                  </div>
                  <div className="grid gap-4">
                    {selectedCase.clues.map((clue, i) => (
                      <div key={i} className="p-6 bg-shadow-card border border-shadow-border rounded-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-shadow-muted opacity-20 group-hover:opacity-100 transition-opacity">
                          FILE_CLUE_{i+1}.DAT
                        </div>
                        <p className="text-xs text-shadow-text leading-relaxed opacity-80">
                          {clue}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right: Modern Editor */}
              <div className="w-1/2 flex flex-col bg-black">
                {selectedCase.status === 'available' ? (
                  <>
                    <div className="p-4 border-b border-shadow-border flex gap-4 bg-shadow-card/10">
                      <button className="p-2 text-shadow-muted hover:text-white"><Bold size={14} /></button>
                      <button className="p-2 text-shadow-muted hover:text-white"><Italic size={14} /></button>
                      <button className="p-2 text-shadow-muted hover:text-white"><List size={14} /></button>
                      <button className="p-2 text-shadow-muted hover:text-white ml-auto"><Save size={14} /></button>
                    </div>
                    <div className="flex-1 p-12 overflow-y-auto">
                      <div className="max-w-2xl mx-auto h-full flex flex-col">
                        <div className="flex items-center gap-2 text-shadow-muted text-[10px] mb-8 font-mono">
                          <FileText size={12} /> REPORT_FILE_DEDUCTION.DOCX
                        </div>
                        <textarea 
                          placeholder="Your analytical deduction goes here..."
                          className="flex-1 bg-transparent text-shadow-text text-sm leading-loose focus:outline-none resize-none font-sans"
                          value={solution}
                          onChange={(e) => setSolution(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-shadow-card/10">
                    <section className="space-y-6">
                      <div className="text-[10px] uppercase tracking-[0.4em] text-shadow-accent font-bold">Simulation Results</div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 border border-shadow-accent bg-shadow-accent/5 rounded-sm">
                          <div className="text-[10px] text-shadow-muted uppercase mb-1">Deduction Accuracy</div>
                          <div className="text-4xl font-light text-white">{selectedCase.score}%</div>
                        </div>
                        <div className="p-8 border border-shadow-border bg-white/5 rounded-sm">
                          <div className="text-[10px] text-shadow-muted uppercase mb-1">Potential Realized</div>
                          <div className="text-4xl font-light text-shadow-accent">+{selectedCase.score >= 60 ? selectedCase.xpReward : 0} XP</div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted font-bold">Evaluator Feedback</div>
                      <div className="p-8 border border-shadow-border bg-black rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-shadow-accent" />
                        <p className="text-sm font-light text-shadow-text leading-loose italic">
                          "{selectedCase.evaluation}"
                        </p>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted font-bold">Absolute Truth (Uncovered)</div>
                      <p className="text-xs text-shadow-muted leading-relaxed italic border-l-2 border-shadow-border pl-6">
                        {selectedCase.hiddenTruth}
                      </p>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BigCaseCard({ caseData, onClick, onDelete }: { caseData: DetectiveCase, onClick: () => void, onDelete: () => void }) {
  const Icon = caseData.discipline === 'logic' ? Brain : caseData.discipline === 'observation' ? Search : Target;
  const deadline = (caseData.expiresAt as Timestamp).toDate();
  const countdown = useCountdown(deadline);
  
  return (
    <motion.div 
      layout
      className={`w-full bg-shadow-card border ${caseData.status === 'passed' ? 'border-shadow-accent/30' : 'border-shadow-border'} hover:border-shadow-accent transition-all rounded-sm group relative overflow-hidden flex items-center justify-between`}
    >
      <button 
        onClick={onClick}
        className="flex-1 p-8 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-full border border-shadow-border group-hover:border-shadow-accent flex items-center justify-center transition-colors">
            <Icon size={20} className="text-shadow-muted group-hover:text-shadow-accent transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[8px] uppercase tracking-widest text-shadow-accent font-bold bg-shadow-accent/10 px-2 py-0.5 rounded-full border border-shadow-accent/20">
                {caseData.difficulty}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-shadow-muted font-mono">{caseData.discipline} SEC</span>
              {caseData.status === 'available' && (
                <span className="text-[8px] uppercase tracking-widest text-red-500 font-mono animate-pulse">
                  DEADLINE: {countdown}
                </span>
              )}
            </div>
            <h4 className="text-lg text-white font-light group-hover:text-shadow-accent transition-colors">{caseData.title}</h4>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-white font-mono">+{caseData.xpReward} XP</div>
            <div className="text-[8px] text-shadow-muted uppercase tracking-widest">Potential Gain</div>
          </div>
          {caseData.status === 'available' ? (
            <ChevronRight size={20} className="text-shadow-muted group-hover:translate-x-1 group-hover:text-shadow-accent transition-all" />
          ) : caseData.status === 'passed' ? (
            <CheckCircle2 size={24} className="text-shadow-accent" />
          ) : (
            <XSquare size={24} className="text-red-500" />
          )}
        </div>
      </button>
      
      {caseData.status === 'available' && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-8 border-l border-shadow-border hover:bg-red-500/10 text-shadow-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
          title="Dismiss Case"
        >
          <Trash2 size={16} />
        </button>
      )}
    </motion.div>
  );
}

function CaseCard({ caseData, onClick, onDelete }: { caseData: DetectiveCase, onClick: () => void, onDelete: () => void }) {
  const Icon = caseData.discipline === 'logic' ? Brain : caseData.discipline === 'observation' ? Search : Target;
  const deadline = (caseData.expiresAt as Timestamp).toDate();
  const countdown = useCountdown(deadline);
  
  return (
    <motion.div 
      layout
      className={`bg-shadow-card border ${caseData.status === 'passed' ? 'border-shadow-accent/30' : 'border-shadow-border'} hover:border-shadow-accent transition-all rounded-sm group relative overflow-hidden`}
    >
      <button 
        onClick={onClick}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <Icon size={14} className="text-shadow-muted group-hover:text-shadow-accent transition-colors" />
          {caseData.status === 'available' && (
            <span className="text-[7px] uppercase tracking-tighter text-red-500 font-mono">
              {countdown}
            </span>
          )}
        </div>
        <h4 className="text-xs text-white group-hover:text-shadow-accent transition-colors truncate mb-8">{caseData.title}</h4>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[8px] uppercase font-bold text-shadow-muted">Difficulty: {caseData.difficulty}</span>
          {caseData.status === 'available' ? (
            <ChevronRight size={14} className="text-shadow-muted group-hover:translate-x-1 transition-all" />
          ) : caseData.status === 'passed' ? (
            <CheckCircle2 size={14} className="text-shadow-accent" />
          ) : (
            <XSquare size={14} className="text-red-500" />
          )}
        </div>
      </button>

      {caseData.status === 'available' && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1 text-shadow-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      )}
    </motion.div>
  );
}

function SpecialCaseSection({ title, cases, icon: Icon, onGenerate, onSelect, onDelete, info }: any) {
  const c = cases[0];
  const countdown = useCountdown(info?.target);
  
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-shadow-accent" />
          <h3 className="text-[10px] uppercase tracking-widest text-white font-bold">{title}</h3>
        </div>
        <div className="text-[8px] font-mono text-shadow-muted uppercase">
          {info?.date}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {c ? (
          <CaseCard caseData={c} onClick={() => onSelect(c)} onDelete={() => onDelete(c.id)} />
        ) : (
          <div className="w-full p-8 border border-dashed border-shadow-border rounded-sm group flex flex-col items-center justify-center space-y-4 opacity-30">
            <div className="w-12 h-12 rounded-full border border-shadow-border flex items-center justify-center text-shadow-muted">
              <Lock size={20} />
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-shadow-muted block mb-1">Scheduled Analysis Locked</span>
              <span className="text-[8px] uppercase tracking-widest text-shadow-accent font-mono animate-pulse">
                {info?.label}: {countdown}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RefreshIcon() {
  return (
    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
  );
}
