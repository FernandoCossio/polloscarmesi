import React, { createContext, useState, useContext, useEffect } from 'react';
import { MobileRole } from '../constants/roles';

interface User {
  username: string;
  role: MobileRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, role: MobileRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setUser(null);
      setIsLoading(false);
    };
    loadSession();
  }, []);

  const login = async (username: string, role: MobileRole) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUser({ username, role });
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
