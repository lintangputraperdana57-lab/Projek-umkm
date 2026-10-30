import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoUser: boolean;
  effectiveUserId: string;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  enterDemoMode: () => void;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_UID_KEY = 'umkm_pro_demo_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoUid, setDemoUid] = useState<string>(() => {
    let stored = localStorage.getItem(LOCAL_STORAGE_DEMO_UID_KEY);
    if (!stored) {
      stored = 'local_guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(LOCAL_STORAGE_DEMO_UID_KEY, stored);
    }
    return stored;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Login dibatalkan oleh pengguna.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Pop-up browser diblokir. Harap izinkan pop-up untuk login Google.');
      } else {
        setAuthError(err.message || 'Gagal login dengan akun Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setIsDemoUser(false);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  const enterDemoMode = () => {
    setIsDemoUser(true);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // If user is authenticated, use their Firebase UID. Otherwise use isolated local guest UID.
  const effectiveUserId = user ? user.uid : demoUid;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoUser,
        effectiveUserId,
        signInWithGoogle,
        signOutUser,
        enterDemoMode,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
