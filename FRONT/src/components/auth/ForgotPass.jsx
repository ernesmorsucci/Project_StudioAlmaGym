import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useFormValidation from '../../hooks/useFormValidation';
import { FormInput } from '../FormComponents';

const ForgotPass = ({ onSuccess }) => {
  const [message, setMessage] = React.useState('');
  const [backendError, setBackendError] = React.useState('');
  const [waitingNextStep, setWaitingNextStep] = React.useState(false);
  const nextStepTimerRef = useRef(null);
  const { forgotPassword } = useAuth();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation({ email: '' }, { email: 'email' });

  useEffect(() => {
    return () => {
      if (nextStepTimerRef.current) {
        clearTimeout(nextStepTimerRef.current);
      }
    };
  }, []);

  const onSubmit = async (formValues) => {
    setMessage('');
    setBackendError('');
    setWaitingNextStep(false);

    try {
      const response = await forgotPassword(formValues.email);
      setMessage(
        response.message ||
          'Si el correo existe, recibirás un código para restablecer tu contraseña.'
      );
      setWaitingNextStep(true);

      nextStepTimerRef.current = setTimeout(() => {
        onSuccess?.(formValues.email);
      }, 3000);
    } catch (err) {
      setBackendError('Ocurrió un error. Intenta de nuevo más tarde.');
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-alma-text tracking-widest mb-2">
          Studio Alma
        </h1>
        <p className="text-alma-textLight text-sm uppercase tracking-widest">
          Recupera tu contraseña
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

        <button
          type="submit"
          disabled={isSubmitting || waitingNextStep}
          className="w-full py-2.5 px-4 bg-alma-olive text-white rounded-lg hover:bg-alma-oliveHover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Enviando...'
            : waitingNextStep
              ? 'Continuando...'
              : 'Enviar código de recuperación'}
        </button>
      </form>
    </>
  );
};

export default ForgotPass;
