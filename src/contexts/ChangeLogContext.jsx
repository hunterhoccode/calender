import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const ChangeLogContext = createContext();

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

export function ChangeLogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  // Load logs from Supabase
  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from('changelog')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (data) {
        setLogs(data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          username: row.username,
          userRole: row.user_role,
          action: row.action,
          actionLabel: row.action_label,
          targetName: row.target_name,
          details: row.details,
          timestamp: row.created_at,
        })));
      }
    }
    loadLogs();

    // Real-time subscription
    const channel = supabase
      .channel('changelog-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'changelog' }, (payload) => {
        const row = payload.new;
        const entry = {
          id: row.id,
          userId: row.user_id,
          username: row.username,
          userRole: row.user_role,
          action: row.action,
          actionLabel: row.action_label,
          targetName: row.target_name,
          details: row.details,
          timestamp: row.created_at,
        };
        setLogs((prev) => {
          if (prev.some((l) => l.id === entry.id)) return prev;
          return [entry, ...prev].slice(0, 500);
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const addLog = useCallback(async (user, action, targetName, details = null) => {
    const entry = {
      user_id: user?.id || null,
      username: user?.displayName || user?.username || 'Unknown',
      user_role: user?.role || 'viewer',
      action,
      action_label: ACTION_LABELS[action] || action,
      target_name: targetName || '',
      details,
    };

    await supabase.from('changelog').insert(entry);
  }, []);

  const clearLogs = useCallback(async () => {
    await supabase.from('changelog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
