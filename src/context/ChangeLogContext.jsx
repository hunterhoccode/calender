import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ChangeLogContext = createContext();

const STORAGE_KEY = 'marketing-calendar-changelog';
const MAX_LOGS = 500;

const ACTION_LABELS = {
  ADD_CAMPAIGN: 'Tạo chiến dịch',
  UPDATE_CAMPAIGN: 'Cập nhật chiến dịch',
  DELETE_CAMPAIGN: 'Xóa chiến dịch',
  DRAG_UPDATE: 'Đổi ngày chiến dịch',
  TOGGLE_MILESTONE: 'Cập nhật milestone',
  ADD_BRAND: 'Tạo thương hiệu',
  UPDATE_BRAND: 'Cập nhật thương hiệu',
  DELETE_BRAND: 'Xóa thương hiệu',
};

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ChangeLogProvider({ children }) {
  const [logs, setLogs] = useState(loadLogs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  }, [logs]);

  const addLog = useCallback((user, action, targetName, details = null) => {
    const entry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userId: user?.id || 'unknown',
      username: user?.displayName || user?.username || 'Unknown',
      userRole: user?.role || 'viewer',
      action,
      actionLabel: ACTION_LABELS[action] || action,
      targetName: targetName || '',
      details,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));
  }, []);

  const clearLogs = useCallback(() => {
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
