import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, getDocs, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const ChangeLogContext = createContext();

const ACTION_LABELS = {
  ADD_CAMPAIGN:      'Tạo chiến dịch',
  UPDATE_CAMPAIGN:   'Cập nhật chiến dịch',
  DELETE_CAMPAIGN:   'Xóa chiến dịch',
  DRAG_UPDATE:       'Đổi ngày chiến dịch',
  TOGGLE_MILESTONE:  'Cập nhật milestone',
  ADD_BRAND:         'Tạo thương hiệu',
  UPDATE_BRAND:      'Cập nhật thương hiệu',
  DELETE_BRAND:      'Xóa thương hiệu',
};

export function ChangeLogProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'changelog'), orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({
        id:          d.id,
        userId:      d.data().userId,
        username:    d.data().username,
        userRole:    d.data().userRole,
        action:      d.data().action,
        actionLabel: d.data().actionLabel,
        targetName:  d.data().targetName,
        details:     d.data().details,
        timestamp:   d.data().createdAt?.toDate?.()?.toISOString() || null,
      })));
    });
    return unsub;
  }, [currentUser]);

  const addLog = useCallback(async (user, action, targetName, details = null) => {
    await addDoc(collection(db, 'changelog'), {
      userId:      user?.id    || null,
      username:    user?.displayName || user?.username || 'Unknown',
      userRole:    user?.role  || 'viewer',
      action,
      actionLabel: ACTION_LABELS[action] || action,
      targetName:  targetName || '',
      details:     details || null,
      createdAt:   serverTimestamp(),
    });
  }, []);

  const clearLogs = useCallback(async () => {
    const snap = await getDocs(collection(db, 'changelog'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    setLogs([]);
  }, []);

  return (
    <ChangeLogContext.Provider value={{ logs, addLog, clearLogs, ACTION_LABELS }}>
      {children}
    </ChangeLogContext.Provider>
  );
}

export function useChangeLog() {
  const ctx = useContext(ChangeLogContext);
  if (!ctx) throw new Error('useChangeLog must be used within ChangeLogProvider');
  return ctx;
}
