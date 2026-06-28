import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(res => setUser(res.data.data))
      .catch(() => setUser(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading,
      isLoading: loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
