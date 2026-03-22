import { useState } from 'react';
import { useChangeLog } from '../context/ChangeLogContext';
import { useAuth } from '../context/AuthContext';
import { X, History, Trash2, Filter } from 'lucide-react';

const ACTION_ICONS = {
  ADD_CAMPAIGN: '➕',
  UPDATE_CAMPAIGN: '✏️',
  DELETE_CAMPAIGN: '🗑️',
  DRAG_UPDATE: '📅',
  TOGGLE_MILESTONE: '✅',
  ADD_BRAND: '🏷️',
  UPDATE_BRAND: '🏷️',
  DELETE_BRAND: '🗑️',
};

const ACTION_COLORS = {
  ADD_CAMPAIGN: 'var(--campaign-green)',
  UPDATE_CAMPAIGN: 'var(--campaign-blue)',
  DELETE_CAMPAIGN: 'var(--campaign-red)',
  DRAG_UPDATE: 'var(--campaign-yellow)',
  TOGGLE_MILESTONE: 'var(--campaign-purple)',
  ADD_BRAND: 'var(--campaign-green)',
  UPDATE_BRAND: 'var(--campaign-blue)',
  DELETE_BRAND: 'var(--campaign-red)',
};

export default function ChangeLogModal({ open, onClose }) {
  const { logs, clearLogs, ACTION_LABELS } = useChangeLog();
  const { hasPermission } = useAuth();
  const [filterAction, setFilterAction] = useState('all');

  if (!open) return null;

  const filteredLogs = filterAction === 'all' ? logs : logs.filter((l) => l.action === filterAction);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-content" style={{ maxWidth: 600 }}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-left">
              <History size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2>Lịch Sử Thay Đổi</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {hasPermission('canManageUsers') && logs.length > 0 && (
                <button className="btn btn-danger" onClick={clearLogs} style={{ fontSize: 'var(--font-xs)', padding: '4px 8px' }}>
                  <Trash2 size={12} />
                  Xóa tất cả
                </button>
              )}
              <button className="drawer-close" onClick={onClose}><X size={18} /></button>
            </div>
          </div>

          {/* Filter */}
          <div className="changelog-filter">
            <Filter size={12} />
            <select
              className="form-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{ fontSize: 'var(--font-xs)', padding: '4px 8px', flex: 1 }}
            >
              <option value="all">Tất cả ({logs.length})</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => {
                const count = logs.filter((l) => l.action === key).length;
                if (count === 0) return null;
                return <option key={key} value={key}>{label} ({count})</option>;
              })}
            </select>
          </div>

          {/* Log list */}
          <div className="changelog-body">
            {filteredLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <History size={32} />
                <p>Chưa có thay đổi nào được ghi nhận</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="changelog-item">
                  <div className="changelog-icon" style={{ color: ACTION_COLORS[log.action] || 'var(--text-tertiary)' }}>
                    {ACTION_ICONS[log.action] || '📝'}
                  </div>
                  <div className="changelog-content">
                    <div className="changelog-action">
                      <strong>{log.username}</strong>
                      <span className="changelog-action-label">{log.actionLabel}</span>
                    </div>
                    {log.targetName && (
                      <div className="changelog-target">{log.targetName}</div>
                    )}
                    <div className="changelog-time">{formatTime(log.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
