import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string, phone: string, role: UserRole, companyId?: string) => { success: boolean; error?: string; userId?: string };
  logout: () => void;
  isAuthenticated: boolean;
  updateUserCompanyId: (userId: string, companyId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  }, [users]);

  const signup = useCallback((name: string, email: string, password: string, phone: string, role: UserRole, companyId?: string) => {
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    const userId = `${role}-${Date.now()}`;
    const newUser: User = {
      id: userId,
      name,
      email,
      password,
      role,
      phone,
      companyId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    // Don't auto-login company users (they need approval first)
    if (role !== 'company') {
      setUser(newUser);
    }
    return { success: true, userId };
  }, [users]);

  const updateUserCompanyId = useCallback((userId: string, companyId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, companyId } : u
    ));
    if (user?.id === userId) {
      setUser(prev => prev ? { ...prev, companyId } : null);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

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
