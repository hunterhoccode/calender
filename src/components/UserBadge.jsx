import { useAuth, ROLES } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function UserBadge() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const role = ROLES[currentUser.role] || ROLES.viewer;
  const initials = (currentUser.displayName || currentUser.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="user-badge">
      <div className="user-badge-avatar" style={{ background: role.color + '25', color: role.color }}>
        {initials}
      </div>
      <div className="user-badge-info">
        <div className="user-badge-name">{currentUser.displayName || currentUser.username}</div>
        <div className="user-badge-role" style={{ color: role.color }}>{role.label}</div>
      </div>
      <button className="user-badge-logout" onClick={logout} title="Đăng xuất">
        <LogOut size={14} />
      </button>
    </div>
  );
}
