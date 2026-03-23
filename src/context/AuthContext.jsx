import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

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

const initialState = {
  users: [],
  currentUser: null,
  userModalOpen: false,
  error: null,
  restoring: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, currentUser: action.payload, error: null, restoring: false };
    case 'LOGOUT':
      return { ...state, currentUser: null, error: null, restoring: false };
    case 'RESTORE_DONE':
      return { ...state, restoring: false };
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

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    role: data.role,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on page load
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted && profile) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
          return;
        }
      }
      if (mounted) dispatch({ type: 'RESTORE_DONE' });
    }).catch(() => {
      if (mounted) dispatch({ type: 'RESTORE_DONE' });
    });
    // Timeout fallback
    const t = setTimeout(() => { if (mounted) dispatch({ type: 'RESTORE_DONE' }); }, 3000);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  // Load all users (for user management)
  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');
    if (!error && data) {
      dispatch({
        type: 'SET_USERS',
        payload: data.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          role: u.role,
          createdAt: u.created_at,
        })),
      });
    }
  }, []);

  useEffect(() => {
    if (state.currentUser) loadUsers();
  }, [state.currentUser, loadUsers]);

  const login = async (email, password) => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const resp = await fetch(`https://rvdpjrxaxvdbouwichru.supabase.co/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHBqcnhheHZkYm91d2ljaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODk4NzAsImV4cCI6MjA4OTc2NTg3MH0.cJZCUQkPjeuDyILv7M14adE1WGLsE8TB-WJ4NFk7pVU',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.access_token) {
        dispatch({ type: 'SET_ERROR', payload: 'Email hoặc mật khẩu không đúng' });
        return false;
      }

      // Set session in supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Fetch profile
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
        return true;
      }

      dispatch({ type: 'SET_ERROR', payload: 'Không tìm thấy profile' });
      return false;
    } catch (e) {
      console.error('Login error:', e);
      dispatch({ type: 'SET_ERROR', payload: 'Lỗi kết nối, vui lòng thử lại' });
      return false;
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (email, password, displayName, role = 'viewer') => {
    dispatch({ type: 'CLEAR_ERROR' });

    if (!email.trim() || !password.trim() || !displayName.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Vui lòng điền đầy đủ thông tin' });
      return false;
    }

    if (password.length < 6) {
      dispatch({ type: 'SET_ERROR', payload: 'Mật khẩu tối thiểu 6 ký tự' });
      return false;
    }

    try {
      const resp = await fetch('https://rvdpjrxaxvdbouwichru.supabase.co/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHBqcnhheHZkYm91d2ljaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODk4NzAsImV4cCI6MjA4OTc2NTg3MH0.cJZCUQkPjeuDyILv7M14adE1WGLsE8TB-WJ4NFk7pVU',
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            username: email.split('@')[0],
            display_name: displayName,
            role,
          },
        }),
      });
      const result = await resp.json();

      if (!resp.ok) {
        dispatch({ type: 'SET_ERROR', payload: result.error?.message || result.msg || 'Lỗi tạo tài khoản' });
        return false;
      }

      const userId = result.id || result.user?.id;
      if (userId) {
        // Create profile via RPC (bypasses RLS)
        const username = email.split('@')[0] + '-' + userId.substring(0, 8);
        await supabase.rpc('create_profile', {
          user_id: userId,
          user_username: username,
          user_display_name: displayName,
          user_role: role,
        });
      }

      await loadUsers();
      return true;
    } catch (e) {
      console.error('Register error:', e);
      dispatch({ type: 'SET_ERROR', payload: 'Lỗi kết nối, vui lòng thử lại' });
      return false;
    }
  };

  const updateUser = async (userId, updates) => {
    const dbUpdates = {};
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.displayName) dbUpdates.display_name = updates.displayName;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (!error) {
      await loadUsers();
      if (state.currentUser?.id === userId) {
        const profile = await fetchProfile(userId);
        if (profile) dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
      }
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    if (userId === state.currentUser?.id) {
      await supabase.auth.updateUser({ password: newPassword });
    }
  };

  const deleteUser = async (userId) => {
    if (userId === state.currentUser?.id) return;
    await supabase.from('profiles').delete().eq('id', userId);
    await loadUsers();
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
    loading: state.restoring,
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
