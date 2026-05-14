import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPass = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingNextStep, setWaitingNextStep] = useState(false);
  const nextStepTimerRef = useRef(null);
  const { forgotPassword } = useAuth();

  useEffect(() => {
    return () => {
      if (nextStepTimerRef.current) {
        clearTimeout(nextStepTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    setWaitingNextStep(false);

    try {
      const response = await forgotPassword(email);
      setMessage(
        response.message ||
          'Si el correo existe, recibirás un código para restablecer tu contraseña.'
      );
      setWaitingNextStep(true);

      nextStepTimerRef.current = setTimeout(() => {
        onSuccess?.(email);
      }, 3000);
    } catch (err) {
      setError('Ocurrió un error. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {message && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-alma-danger text-sm p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-alma-text mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || waitingNextStep}
          className="w-full py-2.5 px-4 bg-alma-olive text-white rounded-lg hover:bg-alma-oliveHover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
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
