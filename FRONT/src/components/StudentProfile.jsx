import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { CheckCircle, AlertCircle, KeyRound, Mail, Loader } from 'lucide-react';

const StudentProfile = () => {
    const { user, setUser } = useAuth();
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Estados para el flujo de Verificación (2FA)
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingChanges, setPendingChanges] = useState(null);
    const [verificationType, setVerificationType] = useState(''); // 'email' o 'password'

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        const emailChanged = formData.email !== user.email;
        const passwordChanged = formData.password.trim() !== '';

        try {
            // Si hay cambios sensibles (Email o Contraseña), disparamos el flujo 2FA
            if (emailChanged || passwordChanged) {
                // Notificamos al backend que envíe el código (al nuevo correo o al actual según corresponda)
                await api.post('/users/request-update-code', { 
                    newEmail: emailChanged ? formData.email : null,
                    changingPassword: passwordChanged
                });
                
                setPendingChanges({
                    name: formData.name,
                    phone: formData.phone,
                    email: emailChanged ? formData.email : undefined,
                    password: passwordChanged ? formData.password : undefined
                });
                
                setVerificationType(emailChanged ? 'email' : 'password');
                setShowCodeModal(true);
            } else {
                // Si solo cambió el nombre o teléfono, actualizamos directo
                const res = await api.put(`/users/${user._id}`, {
                    name: formData.name,
                    phone: formData.phone
                });
                setUser({ ...user, name: formData.name, phone: formData.phone });
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al procesar la solicitud.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            return setMessage({ type: 'error', text: 'El código debe tener 6 dígitos.' });
        }

        setLoading(true);
        try {
            // Mandamos el código y los datos pendientes para que el backend valide y guarde todo junto
            const res = await api.post('/users/verify-update', {
                code: verificationCode,
                updates: pendingChanges
            });

            // Actualizamos el contexto global
            setUser(res.data.payload);
            
            setShowCodeModal(false);
            setVerificationCode('');
            setFormData({ ...formData, password: '' }); 
            setMessage({ type: 'success', text: '¡Cambios verificados y guardados con éxito!' });
            
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Código inválido o expirado.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <h2 className="text-4xl font-serif text-alma-text mb-8">Mi perfil</h2>

            {message.text && !showCodeModal && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 font-medium max-w-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Datos personales</h3>
                
                <form onSubmit={handleInitialSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Nombre completo</label>
                        <input 
                            type="text" 
                            name="name"
                            required
                            value={formData.name} 
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            required
                            value={formData.email} 
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Teléfono</label>
                        <input 
                            type="text" 
                            name="phone"
                            value={formData.phone} 
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700" 
                        />
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Nueva contraseña</label>
                        <input 
                            type="password" 
                            name="password"
                            placeholder="Dejar vacío para no cambiar"
                            value={formData.password} 
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700 placeholder:text-gray-400" 
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#6B7A5C] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && !showCodeModal ? <Loader className="w-4 h-4 animate-spin"/> : null}
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL DE VERIFICACIÓN 2FA */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-alma-olive/10 text-alma-olive rounded-full flex items-center justify-center mx-auto mb-4">
                            {verificationType === 'email' ? <Mail className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
                        </div>
                        <h3 className="text-2xl font-serif text-alma-text mb-2">Verificación de seguridad</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Hemos enviado un código de 6 dígitos a <br/>
                            <span className="font-bold text-gray-700">
                                {verificationType === 'email' ? formData.email : user.email}
                            </span>.
                        </p>

                        <input 
                            type="text" 
                            maxLength="6"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} // Solo números
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none mb-4"
                        />

                        {message.text && (
                            <p className="text-sm text-red-500 font-medium mb-4">{message.text}</p>
                        )}

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleVerifyCode}
                                disabled={verificationCode.length !== 6 || loading}
                                className="w-full bg-alma-olive text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin"/> : 'Confirmar cambios'}
                            </button>
                            <button 
                                onClick={() => { setShowCodeModal(false); setVerificationCode(''); setMessage({type:'', text:''}); }}
                                disabled={loading}
                                className="w-full py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;