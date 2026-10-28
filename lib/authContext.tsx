'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'staff';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_AUTH_KEY = 'adak_current_user';

export const VALID_USERS = [
  {
    username: 'mehran',
    password: 'MehranAdak',
    name: 'مهران (مدیر بوتیک)',
    role: 'admin' as UserRole,
  },
  {
    username: 'Adak',
    password: '123456',
    name: 'آداک (صندوق‌دار و فروش)',
    role: 'staff' as UserRole,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_AUTH_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse auth user', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    const matched = VALID_USERS.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.password === pass
    );

    if (matched) {
      const userInfo: User = {
        username: matched.username,
        name: matched.name,
        role: matched.role,
      };
      setUser(userInfo);
      localStorage.setItem(LS_AUTH_KEY, JSON.stringify(userInfo));
      return { success: true };
    }

    return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_AUTH_KEY);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

