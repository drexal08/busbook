import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { login as fbLogin, logout as fbLogout, register as fbRegister } from '../lib/auth';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone: string, role: UserRole, companyId?: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserCompanyId: (userId: string, companyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUser(snap.data() as User);
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { profile } = await fbLogin(email, password);
      setUser(profile as User);
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid email or password' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, phone: string, role: UserRole, companyId?: string) => {
    try {
      const firebaseUser = await fbRegister(name, email, password, phone, role, companyId);
      return { success: true, userId: firebaseUser.uid };
    } catch (e: any) {
      return { success: false, error: e.message || 'Signup failed' };
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

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, updateUserCompanyId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
