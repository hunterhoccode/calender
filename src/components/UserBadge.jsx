import { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, X, Save } from 'lucide-react';

export default function UserBadge() {
  const { currentUser, logout, dispatch } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!currentUser) return null;

  const role = ROLES[currentUser.role] || ROLES.viewer;
  const initials = (currentUser.displayName || currentUser.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleOpen = () => {
    setForm({ displayName: currentUser.displayName || '', newPassword: '' });
    setMessage('');
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Update display name
      if (form.displayName.trim() && form.displayName !== currentUser.displayName) {
        const { error } = await supabase.from('profiles').update({
          display_name: form.displayName.trim(),
        }).eq('id', currentUser.id);
        if (error) { setMessage('Lỗi cập nhật tên: ' + error.message); setSaving(false); return; }
      }

      // Update password
      if (form.newPassword.trim()) {
        if (form.newPassword.length < 6) {
          setMessage('Mật khẩu tối thiểu 6 ký tự');
          setSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: form.newPassword });
        if (error) { setMessage('Lỗi đổi mật khẩu: ' + error.message); setSaving(false); return; }
      }

      // Update local state
      if (form.displayName.trim() && form.displayName !== currentUser.displayName) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { ...currentUser, displayName: form.displayName.trim() },
        });
      }

      setMessage('Cập nhật thành công!');
      setTimeout(() => setEditOpen(false), 1000);
    } catch (e) {
      setMessage('Lỗi: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <>
      <div className="user-badge">
        <div className="user-badge-avatar" style={{ background: role.color + '25', color: role.color }}>
          {initials}
        </div>
        <div className="user-badge-info">
          <div className="user-badge-name">{currentUser.displayName || currentUser.username}</div>
          <div className="user-badge-role" style={{ color: role.color }}>{role.label}</div>
        </div>
        <button className="user-badge-logout" onClick={handleOpen} title="Cài đặt tài khoản">
          <Settings size={14} />
        </button>
        <button className="user-badge-logout" onClick={logout} title="Đăng xuất">
          <LogOut size={14} />
        </button>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <>
          <div className="modal-overlay" onClick={() => setEditOpen(false)} />
          <div className="modal-container">
            <div className="modal-content" style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <div className="modal-header-left">
                  <Settings size={18} style={{ color: 'var(--accent-primary)' }} />
                  <h2>Thông tin tài khoản</h2>
                </div>
                <button className="drawer-close" onClick={() => setEditOpen(false)} aria-label="Đóng">
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* Avatar + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                  <div className="user-badge-avatar" style={{ background: role.color + '25', color: role.color, width: 48, height: 48, fontSize: 'var(--font-md)' }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currentUser.displayName || currentUser.username}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: role.color }}>{role.label}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {currentUser.username}@cmp.local
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="form-group">
                  <label className="form-label">Tên hiển thị</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                    placeholder="Nhập tên hiển thị"
                  />
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    className="form-input"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Để trống nếu không đổi (tối thiểu 6 ký tự)"
                  />
                </div>

                {/* Message */}
                {message && (
                  <div style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-sm)',
                    background: message.includes('thành công') ? 'var(--campaign-green-bg)' : 'var(--campaign-red-bg)',
                    color: message.includes('thành công') ? 'var(--campaign-green)' : 'var(--campaign-red)',
                  }}>
                    {message}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setEditOpen(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
