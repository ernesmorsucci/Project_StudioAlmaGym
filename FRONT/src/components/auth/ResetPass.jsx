import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ResetPass = ({ initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await resetPassword(email, code, newPassword);
      setMessage(
        response.message ||
          'Contraseña restablecida con éxito. Te redirigiremos al login en 3 segundos.'
      );

      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo más tarde.');
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
          Restablece tu contraseña
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

        <div>
          <label className="block text-sm font-medium text-alma-text mb-1">
            Código de recuperación
          </label>
          <input
            type="text"
            inputMode="numeric"
            className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-alma-text mb-1">
            Nueva contraseña
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-alma-olive text-white rounded-lg hover:bg-alma-oliveHover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
        </button>
      </form>
    </>
  );
};

export default ResetPass;
