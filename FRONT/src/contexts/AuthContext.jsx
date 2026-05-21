import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Al recargar la página, preguntamos al backend si la cookie sigue siendo válida
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/current');
        setUser(data.payload);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          setAuthError('No se pudo conectar con el servidor. Revisá VITE_API_URL en el deploy.');
        }
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
    await api.post('/auth/register', { email, password, name, phone, rol });
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.payload);
    return data;
  };

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
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-alma-bg px-6 text-center">
          <div>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-alma-olive" />
            <p className="text-sm font-medium text-gray-600">Conectando con Studio Alma...</p>
          </div>
        </div>
      ) : authError ? (
        <div className="flex min-h-screen items-center justify-center bg-alma-bg px-6 text-center">
          <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-lg font-bold text-red-600">Error de conexión</h1>
            <p className="text-sm text-gray-600">{authError}</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
