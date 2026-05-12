import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getRedirectPath = (user) => {
  const role = (user?.role || user?.rol || '').toLowerCase();

  if (role === 'profesor') return '/profesor';
  if (role === 'admin') return '/admin';
  return '/inicio';
};

const Auth = () => {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isLogin
        ? await login(formData.email, formData.password)
        : await register(
            formData.email,
            formData.password,
            formData.name,
            formData.phone,
            'alumno'
          );

      navigate(getRedirectPath(response.payload), { replace: true });
    } catch (err) {
      setError(
        isLogin
          ? 'Credenciales incorrectas. Intenta de nuevo.'
          : 'No pudimos crear tu cuenta. Revisa los datos e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alma-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-alma-border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-alma-text tracking-widest mb-2">
            Studio Alma
          </h1>
          <p className="text-alma-textLight text-sm uppercase tracking-widest">
            {isLogin ? 'Acceso a tu cuenta' : 'Crea tu cuenta'}
          </p>
        </div>

        <div className="relative grid grid-cols-2 bg-alma-bg border border-alma-border rounded-lg p-1 mb-6">
          <span
            className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-md bg-alma-olive transition-transform duration-300 ${
              isLogin ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`relative z-10 py-2 text-sm font-medium rounded-md transition-colors ${
              isLogin ? 'text-white' : 'text-alma-textLight hover:text-alma-text'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`relative z-10 py-2 text-sm font-medium rounded-md transition-colors ${
              !isLogin ? 'text-white' : 'text-alma-textLight hover:text-alma-text'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-alma-danger text-sm p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-alma-text mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {isLogin && (
            <div className="text-right -mt-2">
              <a
                href="/reset-pass"
                className="text-sm text-alma-olive hover:text-alma-oliveHover transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-alma-text mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
                value={formData.phone}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-alma-olive hover:bg-alma-oliveHover text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Procesando...'
              : isLogin
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
