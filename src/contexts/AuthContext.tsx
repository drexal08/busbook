import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  login as fbLogin,
  loginWithFacebook as fbLoginWithFacebook,
  loginWithGoogle as fbLoginWithGoogle,
  logout as fbLogout,
  refreshCurrentUserProfile,
  register as fbRegister,
} from '../lib/auth';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; profile?: User }>;
  signup: (
    name: string,
    email: string,
    password: string,
    phone: string,
    role: UserRole,
    companyId?: string,
    verification?: { emailOtpVerified?: boolean; phoneVerified?: boolean }
  ) => Promise<{ success: boolean; error?: string; userId?: string; profile?: User }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; profile?: User }>;
  loginWithFacebook: () => Promise<{ success: boolean; error?: string; profile?: User }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserCompanyId: (userId: string, companyId: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await refreshCurrentUserProfile();
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { profile } = await fbLogin(email, password);
      setUser(profile as User);
      return { success: true, profile: profile as User };
    } catch (e: any) {
      return { success: false, error: e.message || 'Invalid email or password' };
    }
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    phone: string,
    role: UserRole,
    companyId?: string,
    verification?: { emailOtpVerified?: boolean; phoneVerified?: boolean }
  ) => {
    try {
      const { user: firebaseUser, profile } = await fbRegister(
        name,
        email,
        password,
        phone,
        role,
        companyId,
        verification
      );
      setUser(profile);
      return { success: true, userId: firebaseUser.uid, profile };
    } catch (e: any) {
      return { success: false, error: e.message || 'Signup failed' };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { profile } = await fbLoginWithGoogle();
      setUser(profile);
      return { success: true, profile };
    } catch (e: any) {
      return { success: false, error: e.message || 'Google login failed' };
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    try {
      const { profile } = await fbLoginWithFacebook();
      setUser(profile);
      return { success: true, profile };
    } catch (e: any) {
      return { success: false, error: e.message || 'Facebook login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    await fbLogout();
    setUser(null);
  }, []);

  const updateUserCompanyId = useCallback(async (userId: string, companyId: string) => {
    await updateDoc(doc(db, 'users', userId), { companyId });
    if (user?.id === userId) setUser(prev => prev ? { ...prev, companyId } : null);
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return null;
    }

    const refreshed = await refreshCurrentUserProfile();
    setUser(refreshed);
    return refreshed;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        isAuthenticated: !!user,
        updateUserCompanyId,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
