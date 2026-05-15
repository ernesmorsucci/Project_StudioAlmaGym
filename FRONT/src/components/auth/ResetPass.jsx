import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput } from '../FormComponents';

const ResetPassForm = ({ initialEmail = '' }) => {
  const [message, setMessage] = useState('');
  const [backendError, setBackendError] = useState('');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation(
    { email: initialEmail, code: '', newPassword: '' },
    { email: 'email', code: 'required', newPassword: 'password' }
  );

  const onSubmit = async (formValues) => {
    setMessage('');
    setBackendError('');

    try {
      const response = await resetPassword(
        formValues.email,
        formValues.code,
        formValues.newPassword
      );
      setMessage(
        response.message ||
          'Contraseña restablecida con éxito. Te redirigiremos al login en 3 segundos.'
      );

      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
    } catch (err) {
      setBackendError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo más tarde.');
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-alma-text tracking-widest mb-2">
          Studio Alma
        </h1>
        <p className="text-alma-textLight text-sm uppercase tracking-widest">
          Restablece tu contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {message && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        {backendError && (
          <div className="bg-red-50 text-alma-danger text-sm p-3 rounded-lg text-center font-medium">
            {backendError}
          </div>
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
          label="Código de recuperación"
          name="code"
          type="text"
          inputMode="numeric"
          value={values.code}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.code}
          touched={touched.code}
          placeholder="Ej: 123456"
          required
        />

        <FormInput
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          value={values.newPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.newPassword}
          touched={touched.newPassword}
          placeholder="Min. 6 caracteres"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-alma-olive text-white rounded-lg hover:bg-alma-oliveHover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
        </button>
      </form>
    </>
  );
};

export default ResetPassForm;
