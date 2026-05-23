import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useFormValidation from '../hooks/useFormValidation';
import { FormInput } from '../components/FormComponents';

const getRedirectPath = (user) => {
  const role = (user?.role || user?.rol || '').toLowerCase();

  if (role === 'profesor') return '/profesor';
  if (role === 'admin') return '/admin';
  return '/inicio';
};

const Auth = () => {
  const [mode, setMode] = useState('login');
  const [backendError, setBackendError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const initialValues = useMemo(
    () =>
      isLogin
        ? { email: '', password: '' }
        : { name: '', email: '', password: '', phone: '' },
    [isLogin]
  );

  const validationSchema = useMemo(
    () =>
      isLogin
        ? { email: 'email', password: 'password' }
        : { name: 'name', email: 'email', password: 'password', phone: 'phone' },
    [isLogin]
  );

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useFormValidation(initialValues, validationSchema);

  // Resetear formulario cuando cambia de modo
  useEffect(() => {
    resetForm();
    setBackendError('');
  }, [mode, resetForm]);

  const onSubmit = async (formValues) => {
    setBackendError('');
    try {
      const response = isLogin
        ? await login(formValues.email, formValues.password)
        : await register(
            formValues.email,
            formValues.password,
            formValues.name,
            formValues.phone,
            'alumno'
          );

      navigate(getRedirectPath(response.payload), { replace: true });
    } catch (err) {
      // 1. Intentamos atrapar el mensaje exacto que envía nuestro backend
      const mensajeReal = err.response?.data?.error;

      // 2. Seteamos el error: Si hay mensaje real, lo mostramos. Si no, usamos los genéricos.
      setBackendError(
        mensajeReal || (
          isLogin
            ? 'Credenciales incorrectas. Intenta de nuevo.'
            : 'No pudimos crear tu cuenta. Revisa los datos e intenta de nuevo.'
        )
      );
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {backendError && (
            <div className="bg-red-50 text-alma-danger text-sm p-3 rounded-lg text-center font-medium">
              {backendError}
            </div>
          )}

          {!isLogin && (
            <FormInput
              label="Nombre completo"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              placeholder="Ej: Laura García"
              required
            />
          )}

          <FormInput
            label="Correo electrónico"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            placeholder="tu@email.com"
            required
          />

          <FormInput
            label="Contraseña"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            placeholder="••••••••"
            required
          />

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
            <FormInput
              label="Teléfono"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              touched={touched.phone}
              placeholder="Ej: +54 9 11 1234-5678"
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-alma-olive hover:bg-alma-oliveHover text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
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
