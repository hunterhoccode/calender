import { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { X, Trash2, Shield, UserPlus } from 'lucide-react';

export default function UserManagement() {
  const { state, dispatch, users, currentUser, updateUser, updateUserPassword, deleteUser, register, hasPermission } = useAuth();
  const [addMode, setAddMode] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', role: 'viewer' });
  const [editPwId, setEditPwId] = useState(null);
  const [newPw, setNewPw] = useState('');

  if (!state.userModalOpen || !hasPermission('canManageUsers')) return null;

  const handleClose = () => dispatch({ type: 'CLOSE_USER_MODAL' });

  const handleAdd = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.displayName.trim()) return;
    const ok = await register(newUser.username, newUser.password, newUser.displayName, newUser.role);
    if (ok) {
      setNewUser({ username: '', password: '', displayName: '', role: 'viewer' });
      setAddMode(false);
    }
  };

  const handleRoleChange = (userId, role) => {
    updateUser(userId, { role });
  };

  const handleSavePw = async (userId) => {
    if (newPw.length < 4) return;
    await updateUserPassword(userId, newPw);
    setEditPwId(null);
    setNewPw('');
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-container">
        <div className="modal-content" style={{ maxWidth: 640 }}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-left">
              <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2>Quản Lý Người Dùng</h2>
            </div>
            <button className="drawer-close" onClick={handleClose}><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ flexDirection: 'column', gap: 0 }}>
            {/* User list */}
            <div className="user-mgmt-list">
              {users.map((user) => (
                <div key={user.id} className="user-mgmt-row">
                  <div className="user-mgmt-avatar" style={{ background: (ROLES[user.role]?.color || '#64748b') + '25', color: ROLES[user.role]?.color || '#64748b' }}>
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="user-mgmt-info">
                    <div className="user-mgmt-name">
                      {user.displayName || user.username}
                      {user.id === currentUser?.id && <span className="user-mgmt-you">Bạn</span>}
                    </div>
                    <div className="user-mgmt-username">@{user.username}</div>
                  </div>

                  {/* Role select */}
                  <select
                    className="form-select user-mgmt-role-select"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentUser?.id}
                  >
                    {Object.entries(ROLES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>

                  {/* Actions */}
                  <div className="user-mgmt-actions">
                    <button
                      className="btn"
                      onClick={() => { setEditPwId(editPwId === user.id ? null : user.id); setNewPw(''); }}
                      style={{ fontSize: 'var(--font-xs)', padding: '4px 8px' }}
                    >
                      Đổi MK
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteUser(user.id)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Password edit row */}
                  {editPwId === user.id && (
                    <div className="user-mgmt-pw-row">
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Mật khẩu mới (tối thiểu 4 ký tự)"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        style={{ flex: 1, fontSize: 'var(--font-xs)' }}
                      />
                      <button className="btn btn-primary" onClick={() => handleSavePw(user.id)} style={{ padding: '4px 12px', fontSize: 'var(--font-xs)' }}>
                        Lưu
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add user */}
            {addMode ? (
              <div className="user-mgmt-add-form">
                <input className="form-input" placeholder="Tên hiển thị" value={newUser.displayName} onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))} />
                <input className="form-input" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} />
                <input className="form-input" placeholder="Mật khẩu" type="text" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
                <select className="form-select" value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                  {Object.entries(ROLES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleAdd}>Tạo</button>
                  <button className="btn" onClick={() => setAddMode(false)}>Hủy</button>
                </div>
              </div>
            ) : (
              <button className="btn" onClick={() => setAddMode(true)} style={{ margin: 'var(--space-md)', alignSelf: 'flex-start' }}>
                <UserPlus size={14} />
                Thêm Người Dùng
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
