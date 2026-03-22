import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const STORAGE_USERS = 'marketing-calendar-users';
const STORAGE_SESSION = 'marketing-calendar-session';

// Role permissions
export const ROLES = {
  admin: { label: 'Admin', color: '#6366f1' },
  editor: { label: 'Editor', color: '#10b981' },
  viewer: { label: 'Viewer', color: '#64748b' },
};

export const PERMISSIONS = {
  admin: { canCreate: true, canEdit: true, canDelete: true, canManageUsers: true, canManageBrands: true },
  editor: { canCreate: true, canEdit: true, canDelete: false, canManageUsers: false, canManageBrands: false },
  viewer: { canCreate: false, canEdit: false, canDelete: false, canManageUsers: false, canManageBrands: false },
};

// Simple hash for localStorage-only auth (not production security)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Seed admin user
const SEED_ADMIN = {
  id: 'user-admin',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initState() {
  let users = loadUsers();
  const session = loadSession();

  // Seed admin if no users exist
  if (users.length === 0) {
    users = [SEED_ADMIN];
    // Password will be set on first save
  }

  const currentUser = session ? users.find((u) => u.id === session.userId) || null : null;

  return {
    users,
    currentUser,
    userModalOpen: false,
    error: null,
  };
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, currentUser: action.payload, error: null };
    case 'LOGOUT':
      return { ...state, currentUser: null, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'OPEN_USER_MODAL':
      return { ...state, userModalOpen: true };
    case 'CLOSE_USER_MODAL':
      return { ...state, userModalOpen: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, null, initState);

  // Persist users
  useEffect(() => {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(state.users));
  }, [state.users]);

  // Persist session
  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify({ userId: state.currentUser.id, loginAt: new Date().toISOString() }));
    } else {
      localStorage.removeItem(STORAGE_SESSION);
    }
  }, [state.currentUser]);

  // Initialize seed admin password
  useEffect(() => {
    (async () => {
      const users = loadUsers();
      const seedAdmin = users.find((u) => u.id === 'user-admin');
      if (seedAdmin && !seedAdmin.passwordHash) {
        seedAdmin.passwordHash = await hashPassword('admin123');
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
        dispatch({ type: 'SET_USERS', payload: users });
      }
    })();
  }, []);

  const login = async (username, password) => {
    dispatch({ type: 'CLEAR_ERROR' });
    const pwHash = await hashPassword(password);
    const user = state.users.find((u) => u.username === username && u.passwordHash === pwHash);
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    }
    dispatch({ type: 'SET_ERROR', payload: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (username, password, displayName, role = 'viewer') => {
    dispatch({ type: 'CLEAR_ERROR' });

    if (!username.trim() || !password.trim() || !displayName.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Vui lòng điền đầy đủ thông tin' });
      return false;
    }

    if (password.length < 4) {
      dispatch({ type: 'SET_ERROR', payload: 'Mật khẩu tối thiểu 4 ký tự' });
      return false;
    }

    if (state.users.some((u) => u.username === username)) {
      dispatch({ type: 'SET_ERROR', payload: 'Tên đăng nhập đã tồn tại' });
      return false;
    }

    const pwHash = await hashPassword(password);
    const newUser = {
      id: 'user-' + Date.now(),
      username,
      displayName,
      passwordHash: pwHash,
      role,
      createdAt: new Date().toISOString(),
    };

    const updated = [...state.users, newUser];
    dispatch({ type: 'SET_USERS', payload: updated });
    return true;
  };

  const updateUser = (userId, updates) => {
    const updated = state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    dispatch({ type: 'SET_USERS', payload: updated });
    // Update currentUser if editing self
    if (state.currentUser?.id === userId) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { ...state.currentUser, ...updates } });
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    const pwHash = await hashPassword(newPassword);
    updateUser(userId, { passwordHash: pwHash });
  };

  const deleteUser = (userId) => {
    if (userId === state.currentUser?.id) return; // Cannot delete self
    const updated = state.users.filter((u) => u.id !== userId);
    dispatch({ type: 'SET_USERS', payload: updated });
  };

  const hasPermission = (permKey) => {
    if (!state.currentUser) return false;
    const perms = PERMISSIONS[state.currentUser.role];
    return perms ? perms[permKey] === true : false;
  };

  const value = {
    state,
    dispatch,
    currentUser: state.currentUser,
    users: state.users,
    isLoggedIn: !!state.currentUser,
    login,
    logout,
    register,
    updateUser,
    updateUserPassword,
    deleteUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
