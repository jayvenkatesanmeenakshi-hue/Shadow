import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Mission, UserStats, LEVELS, XP_PER_LEVEL, BADGES, JournalTopic, JournalEntry } from '../types';
import { DEFAULT_MISSIONS, FOCUS_ROTATION } from '../constants';

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: '',
  badges: [],
  completedCount: 0,
  categories: {
    logic: 0,
    observation: 0,
    strategy: 0,
    discipline: 0,
  },
};

export function useShadowStore() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync Stats
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as UserStats);
      } else {
        // Initialize user record if not exists
        const initialWithTimestamp = { ...INITIAL_STATS, updatedAt: serverTimestamp() };
        setDoc(userDocRef, initialWithTimestamp)
          .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Sync Missions
  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const missionsRef = collection(db, 'users', user.uid, 'missions');
    const q = query(
      missionsRef, 
      where('userId', '==', user.uid),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        generateDailyMissions(user.uid, today);
      } else {
        const missionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        // Sort by their original index if needed, for consistency
        setMissions(missionList);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/missions`));

    return () => unsubscribe();
  }, [user]);

  const generateDailyMissions = async (userId: string, dateStr: string) => {
    const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
    const batch = writeBatch(db);
    
    DEFAULT_MISSIONS.forEach((m, idx) => {
      let finalName = m.name;
      if (m.name === 'Focus Block') {
        finalName = `Focus Block: ${FOCUS_ROTATION[dayOfWeek]}`;
      }
      const missionId = `${dateStr}-${idx}`;
      const missionRef = doc(db, 'users', userId, 'missions', missionId);
      
      batch.set(missionRef, {
        ...m,
        id: missionId,
        userId,
        name: finalName,
        isCompleted: false,
        notes: '',
        date: dateStr,
        updatedAt: serverTimestamp()
      });
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/missions (batch)`);
    }
  };

  const completeMission = useCallback(async (id: string) => {
    if (!user) return;

    const missionIndex = missions.findIndex(m => m.id === id);
    if (missionIndex === -1 || missions[missionIndex].isCompleted) return;

    const missionRef = doc(db, 'users', user.uid, 'missions', id);
    const mission = missions[missionIndex];

    try {
      await updateDoc(missionRef, {
        isCompleted: true,
        updatedAt: serverTimestamp()
      });
      
      const xpGain = 100;
      await updateStatsOnCompletion(xpGain, mission.category);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/missions/${id}`);
    }
  }, [user, missions, stats]);

  const updateStatsOnCompletion = async (xpGain: number, category: string) => {
    if (!user) return;

    const newXp = stats.xp + xpGain;
    const newLevel = Math.min(Math.floor(newXp / XP_PER_LEVEL), LEVELS.length - 1);
    const today = new Date().toISOString().split('T')[0];
    
    let newStreak = stats.streak;
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (stats.lastActiveDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const newBadges = [...stats.badges];
    BADGES.forEach(b => {
      if (newStreak >= b.threshold && !newBadges.includes(b.id)) {
        newBadges.push(b.id);
      }
    });

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: today,
        completedCount: stats.completedCount + 1,
        badges: newBadges,
        'categories.discipline': stats.categories.discipline + 1,
        ...(category === 'Focus' ? { 'categories.logic': stats.categories.logic + 1 } : {}),
        ...(category === 'Analysis' ? { 'categories.observation': stats.categories.observation + 1 } : {}),
        ...(category === 'Gaming' ? { 'categories.strategy': stats.categories.strategy + 1 } : {}),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateMissionNotes = async (id: string, notes: string) => {
    if (!user) return;
    const missionRef = doc(db, 'users', user.uid, 'missions', id);
    try {
      await updateDoc(missionRef, {
        notes,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/missions/${id}`);
    }
  };

  const setChessUsername = async (username: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        chessUsername: username,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addJournalTopic = async (name: string) => {
    if (!user) return;
    const topicRef = doc(collection(db, 'users', user.uid, 'topics'));
    try {
      await setDoc(topicRef, {
        id: topicRef.id,
        userId: user.uid,
        name,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/topics`);
    }
  };

  const addJournalEntry = async (topicId: string, date: string, deductions: string) => {
    if (!user) return;
    const entryRef = doc(collection(db, 'users', user.uid, 'topics', topicId, 'entries'));
    try {
      await setDoc(entryRef, {
        id: entryRef.id,
        topicId,
        userId: user.uid,
        date,
        deductions,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/topics/${topicId}/entries`);
    }
  };

  const updateJournalEntry = async (topicId: string, entryId: string, deductions: string) => {
    if (!user) return;
    const entryRef = doc(db, 'users', user.uid, 'topics', topicId, 'entries', entryId);
    try {
      await updateDoc(entryRef, {
        deductions,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/topics/${topicId}/entries/${entryId}`);
    }
  };

  return {
    stats,
    missions,
    completeMission,
    updateMissionNotes,
    setChessUsername,
    addJournalTopic,
    addJournalEntry,
    updateJournalEntry,
    loading
  };
}
