import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const ROLES = {
  admin:  { label: 'Admin',  color: '#6366f1' },
  editor: { label: 'Editor', color: '#10b981' },
  viewer: { label: 'Viewer', color: '#64748b' },
};

export const PERMISSIONS = {
  admin:  { canCreate: true,  canEdit: true,  canDelete: true,  canManageUsers: true,  canManageBrands: true  },
  editor: { canCreate: true,  canEdit: true,  canDelete: false, canManageUsers: false, canManageBrands: false },
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
    case 'LOGIN_SUCCESS':    return { ...state, currentUser: action.payload, error: null, restoring: false };
    case 'LOGOUT':           return { ...state, currentUser: null, error: null, restoring: false };
    case 'RESTORE_DONE':     return { ...state, restoring: false };
    case 'SET_ERROR':        return { ...state, error: action.payload };
    case 'CLEAR_ERROR':      return { ...state, error: null };
    case 'SET_USERS':        return { ...state, users: action.payload };
    case 'OPEN_USER_MODAL':  return { ...state, userModalOpen: true };
    case 'CLOSE_USER_MODAL': return { ...state, userModalOpen: false };
    default: return state;
  }
}

async function fetchProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id:          uid,
    username:    d.username,
    displayName: d.displayName,
    role:        d.role,
    createdAt:   d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchProfile(firebaseUser.uid);
        if (profile) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
          return;
        }
      }
      dispatch({ type: 'RESTORE_DONE' });
    });
    return unsubscribe;
  }, []);

  const loadUsers = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt')));
    dispatch({
      type: 'SET_USERS',
      payload: snap.docs.map((d) => ({
        id:          d.id,
        username:    d.data().username,
        displayName: d.data().displayName,
        role:        d.data().role,
        createdAt:   d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
      })),
    });
  }, []);

  useEffect(() => {
    if (state.currentUser) loadUsers();
  }, [state.currentUser, loadUsers]);

  const login = async (email, password) => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchProfile(cred.user.uid);
      if (profile) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
        return true;
      }
      dispatch({ type: 'SET_ERROR', payload: 'Không tìm thấy profile' });
      return false;
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Email hoặc mật khẩu không đúng' });
      return false;
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (email, password, displayName) => {
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const username = email.split('@')[0] + '-' + uid.substring(0, 8);
      await setDoc(doc(db, 'users', uid), {
        username,
        displayName,
        role: 'viewer', // role is always viewer on self-registration; admin assigns roles manually
        createdAt: serverTimestamp(),
      });
      await loadUsers();
      return true;
    } catch (e) {
      // Generic message to prevent email enumeration
      dispatch({ type: 'SET_ERROR', payload: 'Không thể tạo tài khoản. Vui lòng thử lại.' });
      return false;
    }
  };

  const updateUser = async (userId, updates) => {
    const dbUpdates = {};
    if (updates.role)        dbUpdates.role        = updates.role;
    if (updates.displayName) dbUpdates.displayName = updates.displayName;
    await updateDoc(doc(db, 'users', userId), dbUpdates);
    await loadUsers();
    if (state.currentUser?.id === userId) {
      const profile = await fetchProfile(userId);
      if (profile) dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    if (userId === state.currentUser?.id && auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  const deleteUser = async (userId) => {
    if (userId === state.currentUser?.id) return;
    await deleteDoc(doc(db, 'users', userId));
    await loadUsers();
  };

  const hasPermission = (permKey) => {
    if (!state.currentUser) return false;
    const perms = PERMISSIONS[state.currentUser.role];
    return perms ? perms[permKey] === true : false;
  };

  const value = {
    state, dispatch,
    currentUser: state.currentUser,
    users: state.users,
    isLoggedIn: !!state.currentUser,
    loading: state.restoring,
    login, logout, register, updateUser, updateUserPassword, deleteUser, hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
