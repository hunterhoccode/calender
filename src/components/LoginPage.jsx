import { useState } from 'react';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { LogIn, UserPlus, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const { login, register, state } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'viewer' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(form.email, form.password);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await register(form.email, form.password, form.displayName, form.role);
    if (ok) {
      setTab('login');
      setForm((prev) => ({ ...prev, displayName: '', role: 'viewer' }));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon"><Zap size={22} /></div>
          <div>
            <h1>CMP PRO</h1>
            <p>Campaign Manager</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            <LogIn size={14} />
            Đăng Nhập
          </button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            <UserPlus size={14} />
            Đăng Ký
          </button>
        </div>

        {/* Error */}
        {state.error && <div className="login-error">{state.error}</div>}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="admin@cmp.local"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
            <p className="login-hint">
              Tài khoản mặc định: <strong>admin@cmp.local</strong> / <strong>admin123</strong>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label className="form-label">Tên hiển thị</label>
              <input
                className="form-input"
                type="text"
                value={form.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="user@email.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select className="form-select" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
                {Object.entries(ROLES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
