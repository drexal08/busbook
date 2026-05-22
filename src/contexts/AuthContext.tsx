import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { login as fbLogin, logout as fbLogout, register as fbRegister } from '../lib/auth';
import { User, UserRole } from '../types';

// HARDCODED ADMIN ACCOUNT CREDENTIALS
const ADMIN_EMAIL = "byiringirinnocent8@gmail.com";
const ADMIN_NAME = "Byiringiro Innocent";
const ADMIN_PHONE = "0796415099";

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
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
          let userData = snap.data() as User;
          
          // If you log in and your role in Firestore isn't 'admin' yet, update and save it!
          if (firebaseUser.email === ADMIN_EMAIL && userData.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin', name: ADMIN_NAME, phone: ADMIN_PHONE });
            userData.role = 'admin';
            userData.name = ADMIN_NAME;
            userData.phone = ADMIN_PHONE;
          }
          
          setUser(userData);
        } else {
          // Fallback: Fixed TypeScript error by type casting the object layout cleanly
          if (firebaseUser.email === ADMIN_EMAIL) {
            const newAdminDoc = {
              id: firebaseUser.uid,
              name: ADMIN_NAME,
              email: ADMIN_EMAIL,
              phone: ADMIN_PHONE,
              role: 'admin' as UserRole,
              password: '', // Provided fallback to satisfy User type constraints
              createdAt: new Date().toISOString() // Provided fallback to satisfy User type constraints
            } as User;

            await setDoc(userRef, newAdminDoc);
            setUser(newAdminDoc);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { profile } = await fbLogin(email, password);
      let updatedProfile = { ...profile } as User;
      
      // Forces a persistent database document upgrade upon explicit login submission
      if (email === ADMIN_EMAIL && updatedProfile.role !== 'admin') {
        const userRef = doc(db, 'users', updatedProfile.id);
        await updateDoc(userRef, { role: 'admin', name: ADMIN_NAME, phone: ADMIN_PHONE });
        updatedProfile.role = 'admin';
        updatedProfile.name = ADMIN_NAME;
        updatedProfile.phone = ADMIN_PHONE;
      }
      
      setUser(updatedProfile);
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid email or password' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, phone: string, role: UserRole) => {
    try {
      const firebaseUser = await fbRegister(name, email, password, phone, role);
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