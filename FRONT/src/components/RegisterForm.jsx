import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await register(name, email, password, phone);
      
    } catch (err) {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-alma-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-alma-border">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-alma-text tracking-widest mb-2">Studio Alma</h1>
          <p className="text-alma-textLight text-sm uppercase tracking-widest">Acceso a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-alma-danger text-sm p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">Correo electrónico</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-alma-text mb-1">Teléfono</label>
            <input 
              type="tel" 
              className="w-full px-4 py-2 border border-alma-border rounded-lg focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-alma-olive hover:bg-alma-oliveHover text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
          >
            Ingresar
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Register;