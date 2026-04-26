/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { JournalTopic, JournalEntry } from '../types';
import { useShadowStore } from '../hooks/useShadowStore';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Plus, ChevronRight, Calendar, Search, Trash2, Edit3, Save, X } from 'lucide-react';

export function JournalTab() {
  const { user } = useAuth();
  const { addJournalTopic, addJournalEntry, updateJournalEntry } = useShadowStore();
  const [topics, setTopics] = useState<JournalTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<JournalTopic | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const topicsRef = collection(db, 'users', user.uid, 'topics');
    const q = query(topicsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopics(snapshot.docs.map(doc => doc.data() as JournalTopic));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/topics`));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedTopic) {
      setEntries([]);
      return;
    }
    const entriesRef = collection(db, 'users', user.uid, 'topics', selectedTopic.id, 'entries');
    const q = query(entriesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => doc.data() as JournalEntry));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/topics/${selectedTopic.id}/entries`));

    return () => unsubscribe();
  }, [user, selectedTopic]);

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addJournalTopic(newTopicName.trim());
      setNewTopicName('');
      setIsAddingTopic(false);
    }
  };

  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-4 border-b border-shadow-border">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-white">Tactical Journal</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-shadow-muted mt-1">Deductive Reasoning Archives</p>
        </div>
        <button 
          onClick={() => setIsAddingTopic(true)}
          className="p-2 bg-shadow-accent text-white rounded-sm hover:brightness-110 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!selectedTopic ? (
          <motion.div 
            key="topics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-shadow-muted" />
              <input 
                type="text"
                placeholder="Search Topics..."
                className="w-full bg-shadow-card/50 border border-shadow-border rounded-sm py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-shadow-accent transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Adding Topic UI */}
            {isAddingTopic && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-shadow-accent bg-shadow-accent/5 rounded-sm flex gap-3"
              >
                <input 
                  autoFocus
                  type="text"
                  placeholder="Topic Name (e.g. Badminton)"
                  className="flex-1 bg-transparent border-b border-shadow-accent text-xs p-1 focus:outline-none"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                />
                <button onClick={handleAddTopic} className="text-[10px] uppercase font-bold text-shadow-accent">Deploy</button>
                <button onClick={() => setIsAddingTopic(false)} className="text-[10px] uppercase font-bold text-shadow-muted">Abort</button>
              </motion.div>
            )}

            {/* Topics List */}
            <div className="grid grid-cols-1 gap-2">
              {filteredTopics.map(topic => (
                <button 
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="flex items-center justify-between p-4 bg-shadow-card border border-shadow-border hover:border-shadow-accent transition-all rounded-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-shadow-bg border border-shadow-border flex items-center justify-center text-shadow-muted group-hover:text-shadow-accent transition-colors">
                      <Book size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{topic.name}</div>
                      <div className="text-[8px] uppercase tracking-widest text-shadow-muted">Topic Code: {topic.id.slice(0, 8)}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-shadow-muted group-hover:text-shadow-accent group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="entries"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="p-2 border border-shadow-border hover:bg-shadow-card transition-colors rounded-sm"
              >
                <X size={16} />
              </button>
              <div>
                <h3 className="text-lg text-white font-light">{selectedTopic.name}</h3>
                <p className="text-[8px] uppercase tracking-widest text-shadow-muted">Active Intelligence Stream</p>
              </div>
            </div>

            <EntryCreator topicId={selectedTopic.id} onAdd={addJournalEntry} />

            <div className="space-y-4">
              {entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} onUpdate={updateJournalEntry} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntryCreator({ topicId, onAdd }: { topicId: string, onAdd: (tid: string, date: string, d: string) => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [deductions, setDeductions] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleSave = () => {
    if (deductions.trim()) {
      onAdd(topicId, today, deductions.trim());
      setDeductions('');
      setIsCreating(false);
    }
  };

  if (!isCreating) {
    return (
      <button 
        onClick={() => setIsCreating(true)}
        className="w-full py-3 border border-dashed border-shadow-border hover:border-shadow-accent transition-all text-[10px] uppercase tracking-widest text-shadow-muted hover:text-shadow-accent rounded-sm"
      >
        + Log Daily Deduction [{today}]
      </button>
    );
  }

  return (
    <div className="p-6 bg-shadow-card border border-shadow-accent rounded-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-shadow-accent">
          <Calendar size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">{today}</span>
        </div>
        <div className="text-[8px] uppercase tracking-widest text-shadow-muted font-mono">Deduction Input Block</div>
      </div>
      <textarea 
        autoFocus
        placeholder="Input tactical analysis or behavioral deductions..."
        className="w-full bg-black/40 border border-shadow-border rounded-sm p-4 text-xs text-shadow-text focus:outline-none focus:border-shadow-accent min-h-[120px] resize-none"
        value={deductions}
        onChange={(e) => setDeductions(e.target.value)}
      />
      <div className="flex justify-end gap-3">
        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-[10px] uppercase font-bold text-shadow-muted hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-shadow-accent text-white text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm"
        >
          Commit
        </button>
      </div>
    </div>
  );
}

function EntryCard({ entry, onUpdate }: { entry: JournalEntry, onUpdate: (tid: string, eid: string, d: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(entry.deductions);

  const handleUpdate = () => {
    onUpdate(entry.topicId, entry.id, text);
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-shadow-card border border-shadow-border rounded-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-shadow-muted">
          <Calendar size={14} />
          <span className="text-[10px] font-mono tracking-widest">{entry.date}</span>
        </div>
        <button 
          onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
          className="p-1 text-shadow-muted hover:text-shadow-accent transition-colors"
        >
          {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
        </button>
      </div>
      
      {isEditing ? (
        <textarea 
          className="w-full bg-black/40 border border-shadow-accent rounded-sm p-4 text-xs text-shadow-text focus:outline-none min-h-[120px] resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <div className="text-xs text-shadow-text leading-relaxed whitespace-pre-wrap font-sans opacity-90 italic">
          "{entry.deductions}"
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end">
          <button onClick={() => { setIsEditing(false); setText(entry.deductions); }} className="text-[10px] uppercase text-shadow-muted pr-4">Discard</button>
        </div>
      )}
    </div>
  );
}
