import React, { createContext, useState, useContext, useEffect } from 'react';
import { MobileRole, mapBackendRoleToMobile } from '../constants/roles';
import { AuthService, decodeJwt } from '../services/auth-service';

interface User {
  username: string;
  role: MobileRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await AuthService.login(username, password);
      const payload = decodeJwt(data.accessToken);
      
      if (!payload) {
        throw new Error('Token JWT inválido o corrupto');
      }

      const backendRole = payload.role || (payload.roles && payload.roles[0]) || 'Cliente';
      const mobileRole = mapBackendRoleToMobile(backendRole);
      const userVal = payload.username || payload.userId || payload.sub || username;

      setUser({
        username: userVal,
        role: mobileRole,
      });
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    AuthService.setToken(null);
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
