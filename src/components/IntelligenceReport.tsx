/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { JournalTopic, JournalEntry, UserStats } from '../types';
import { IntelligenceService } from '../services/IntelligenceService';
import { motion } from 'motion/react';
import { Brain, Search, Zap, Target, Shield, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function IntelligenceReport() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [report, setReport] = useState<{ text: string, percentile: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We pull data on demand when Generate Report is clicked
  useEffect(() => {
    // Component cleanup if necessary
  }, [user]);

  const generateReport = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const { doc, getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (!userSnap.exists()) {
        throw new Error("User profile not found. Please complete a mission first.");
      }
      const currentStats = userSnap.data() as UserStats;

      // 2. Fetch all Topics & Entries
      const topicsRef = collection(db, 'users', user.uid, 'topics');
      const topicsSnap = await getDocs(topicsRef);
      const topics = topicsSnap.docs.map(d => d.data() as JournalTopic);

      const allEntries: JournalEntry[] = [];
      for (const topic of topics) {
        const entriesRef = collection(db, 'users', user.uid, 'topics', topic.id, 'entries');
        const entriesSnap = await getDocs(entriesRef);
        allEntries.push(...entriesSnap.docs.map(d => d.data() as JournalEntry));
      }

      if (allEntries.length === 0) {
        throw new Error("Insufficient data. The intelligence archive requires a minimum of one tactical entry.");
      }

      // 3. AI Analysis
      const result = await IntelligenceService.generateShadowReport(currentStats, topics, allEntries);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to establish AI uplink.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-shadow-border">
        <h2 className="text-2xl font-light tracking-tight text-white">Shadow Intelligence Report</h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-shadow-muted mt-1">AI-Powered Psychological Profile & Progress Assessment</p>
      </div>

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-20 border border-shadow-border bg-shadow-card/20 rounded-sm space-y-6">
          <Brain size={48} className="text-shadow-muted opacity-20" />
          <div className="text-center space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Initiate Tactical Analysis</h3>
            <p className="text-[10px] text-shadow-muted uppercase tracking-tight max-w-xs mx-auto">Gemini will scan your journal archives to calculate your Shadow Percentile.</p>
          </div>
          <button 
            onClick={generateReport}
            className="px-8 py-3 bg-shadow-accent text-white text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm hover:brightness-110 transition-all flex items-center gap-3"
          >
            <RefreshCw size={16} /> Analysis Authorization
          </button>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-2 border-shadow-accent/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-shadow-accent rounded-full animate-spin" />
            <Brain size={32} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-shadow-accent animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-shadow-accent animate-pulse font-mono">Syncing Cerebral Networks...</p>
            <p className="text-[8px] text-shadow-muted uppercase tracking-widest">Scanning deductive logs for pattern anomalies</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-[10px] uppercase tracking-widest text-center rounded-sm">
          {error}
          <button onClick={() => setError(null)} className="block mx-auto mt-4 underline">Retry Link</button>
        </div>
      )}

      {report && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Percentile Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 border border-shadow-accent bg-shadow-accent/5 rounded-sm flex flex-col items-center justify-center space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-shadow-accent font-bold">Shadow Percentile</div>
              <div className="text-6xl font-light text-white">{report.percentile}<span className="text-xl text-shadow-accent opacity-50">%</span></div>
              <div className="text-[8px] uppercase tracking-widest text-shadow-muted">Kira-Equivalent Threshold</div>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <ReportMetric icon={Target} label="Logical Precision" value={(report.percentile * 0.9).toFixed(1)} unit="%" />
              <ReportMetric icon={Shield} label="Emotional Resilience" value={(report.percentile * 0.85).toFixed(1)} unit="%" />
              <ReportMetric icon={Zap} label="Strategic Foresight" value={(report.percentile * 1.1).toFixed(1)} unit="%" />
              <ReportMetric icon={Search} label="Observation Breadth" value={(report.percentile * 0.95).toFixed(1)} unit="%" />
            </div>
          </div>

          {/* Analysis Text */}
          <div className="p-8 bg-shadow-card border border-shadow-border rounded-sm">
            <div className="text-[10px] uppercase tracking-[0.4em] text-shadow-muted mb-8 pb-4 border-b border-shadow-border flex justify-between items-center">
              <span>Executive Tactical Assessment</span>
              <span className="font-mono">TIMESTAMP: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-sm text-shadow-text leading-loose whitespace-pre-wrap font-sans opacity-90 prose prose-invert max-w-none">
              <ReactMarkdown>{report.text}</ReactMarkdown>
            </div>
            <button 
              onClick={generateReport}
              className="mt-8 text-[10px] uppercase tracking-widest text-shadow-muted hover:text-shadow-accent transition-colors flex items-center gap-2"
            >
              <RefreshCw size={12} /> Re-verify Integrity
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ReportMetric({ icon: Icon, label, value, unit }: { icon: any, label: string, value: string, unit: string }) {
  return (
    <div className="p-4 border border-shadow-border bg-shadow-card/50 rounded-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-shadow-muted" />
        <span className="text-[10px] uppercase tracking-widest text-shadow-muted">{label}</span>
      </div>
      <div className="text-xl font-light text-white">
        {value}<span className="text-xs text-shadow-muted ml-0.5">{unit}</span>
      </div>
    </div>
  );
}
