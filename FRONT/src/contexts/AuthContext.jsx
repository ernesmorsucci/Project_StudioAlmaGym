import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al recargar la página, preguntamos al backend si la cookie sigue siendo válida
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/current');
        setUser(data.payload);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.payload);
    return data; // <-- ¡Esta línea es clave para que el Login sepa el rol!
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const register = async (email, password, name, phone, rol) => {
    const { data } = await api.post('/auth/register', { email, password, name, phone, rol });
    setUser(data.payload);
    return data;
  }

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  }

  const resetPassword = async (email, code, newPassword) => {
    const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, forgotPassword, resetPassword, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
