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
          
          // Upgrades your existing passenger doc field permanently to admin when you log in
          if (firebaseUser.email === ADMIN_EMAIL && userData.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin' as UserRole, name: ADMIN_NAME, phone: ADMIN_PHONE });
            userData.role = 'admin' as UserRole;
            userData.name = ADMIN_NAME;
            userData.phone = ADMIN_PHONE;
          }
          
          setUser(userData);
        } else {
          // If you exist in Auth but somehow don't have a document yet
          if (firebaseUser.email === ADMIN_EMAIL) {
            const newAdminDoc = {
              id: firebaseUser.uid,
              name: ADMIN_NAME,
              email: ADMIN_EMAIL,
              phone: ADMIN_PHONE,
              role: 'admin' as UserRole,
              password: '',
              createdAt: new Date().toISOString()
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
      
      // Upgrades your role to admin on the spot if it matches your email
      if (email === ADMIN_EMAIL && updatedProfile.role !== 'admin') {
        const userRef = doc(db, 'users', updatedProfile.id);
        await updateDoc(userRef, { role: 'admin' as UserRole, name: ADMIN_NAME, phone: ADMIN_PHONE });
        updatedProfile.role = 'admin' as UserRole;
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
      // Clean fix: If it's your admin email trying to register, pass it to 'passenger' in the library 
      // to keep TypeScript happy. The useEffect listener above will catch it immediately and save it as an 'admin' document.
      const libraryRole = email === ADMIN_EMAIL ? ('passenger' as const) : (role as 'passenger' | 'company');
      
      const firebaseUser = await fbRegister(name, email, password, phone, libraryRole);
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