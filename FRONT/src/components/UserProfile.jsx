import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
// 📱 Agregamos el icono Smartphone para la modal
import { CheckCircle, AlertCircle, KeyRound, Mail, Loader, Smartphone } from 'lucide-react';

const UserProfile = () => {
    const { user, setUser } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [showCodeModal, setShowCodeModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingChanges, setPendingChanges] = useState(null);
    const [verificationType, setVerificationType] = useState(''); // 'email', 'password' o 'phone'

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 📱 NUEVA FUNCIÓN: Pedirle al backend que "envíe" el SMS
    const handleSendPhoneCode = async () => {
        setLoading(true);
        try {
            // 📱 Enviamos el número actual del input, esté guardado o no
            await api.post('/users/send-phone-code', { phone: formData.phone });
            setVerificationType('phone');
            setShowCodeModal(true);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al solicitar el código' });
        } finally {
            setLoading(false);
        }
    };

    const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailChanged = formData.email !== user.email;
    const passwordChanged = formData.password.trim() !== '';
    const phoneChanged = formData.phone !== user.phone; // 📱 Detectamos cambio de tel

    try {
        // 🔥 Si cambia CUALQUIERA de estos tres, pedimos código
        if (emailChanged || passwordChanged || phoneChanged) {
            await api.post('/users/request-update-code', { 
                newEmail: emailChanged ? formData.email : null,
                changingPassword: passwordChanged,
                newPhone: phoneChanged ? formData.phone : null // Avisamos al back
            });
            
            setPendingChanges({
                name: formData.name,
                phone: formData.phone, // El nuevo número queda "en espera"
                email: emailChanged ? formData.email : undefined,
                password: passwordChanged ? formData.password : undefined
            });
            
            // Prioridad de mensaje en la modal
            setVerificationType(phoneChanged ? 'phone' : (emailChanged ? 'email' : 'password'));
            setShowCodeModal(true);
        } else {
            // Si solo cambió el nombre, hacemos el update directo
            const res = await api.put(`/users/${user._id}`, { name: formData.name });
            setUser(res.data.payload);
            setMessage({ type: 'success', text: 'Perfil actualizado' });
        }
    } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
        setLoading(false);
    }
};

    const handleVerifyCode = async (e) => {
        if (e) e.preventDefault();
        if (loading) return;

        if (verificationCode.length !== 6) {
            return setMessage({ type: 'error', text: 'El código debe tener 6 dígitos.' });
        }

        setLoading(true);
        try {
            // 📱 SI EL TIPO DE VERIFICACIÓN ES TELÉFONO:
            if (verificationType === 'phone') {
                await api.post('/users/verify-phone-code', { code: verificationCode });

                if (typeof setUser === 'function') {
                    setUser({ ...user, isPhoneVerified: true, phone: formData.phone });
                }

                setMessage({ type: 'success', text: '¡Teléfono verificado con éxito! 📱' });
            }
            // SI ES EMAIL O CONTRASEÑA (Lo que ya tenías)
            else {
                const res = await api.post('/users/verify-update', {
                    code: verificationCode,
                    updates: pendingChanges
                });

                if (typeof setUser === 'function') {
                    setUser(res.data.payload);
                }

                const successText = verificationType === 'password'
                    ? '¡Contraseña cambiada correctamente! 🔐'
                    : '¡Correo verificado y actualizado con éxito! 📧';

                setMessage({ type: 'success', text: successText });
            }

            setShowCodeModal(false);
            setVerificationCode('');
            setFormData({ ...formData, password: '' });

            setTimeout(() => setMessage({ type: '', text: '' }), 6000);
        } catch (error) {
            console.error("🔍 Detalles del error capturado:", error);
            let errorText = 'Ocurrió un error inesperado.';
            if (error.response && error.response.data && error.response.data.error) {
                errorText = error.response.data.error;
            } else if (error.message) {
                errorText = error.message;
            }
            setMessage({ type: 'error', text: errorText });
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

                    {/* 📱 NUEVO CAMPO DE TELÉFONO CON BOTÓN DE VERIFICAR */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Teléfono (WhatsApp)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700"
                            />
                            {user?.isPhoneVerified ? (
                                <span className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-xs font-bold">
                                    <CheckCircle className="w-4 h-4" /> Verificado
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendPhoneCode}
                                    disabled={!formData.phone || loading}
                                    title={formData.phone !== user?.phone ? "Primero guarda el perfil para verificar este número" : "Verificar número"}
                                    className="whitespace-nowrap px-4 py-2 bg-alma-olive text-white font-bold rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50 text-sm shadow-sm"
                                >
                                    Verificar
                                </button>
                            )}
                        </div>
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
                            {loading && !showCodeModal ? <Loader className="w-4 h-4 animate-spin" /> : null}
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
                            {/* 📱 DIBUJAMOS EL ICONO CORRECTO */}
                            {verificationType === 'email' ? <Mail className="w-8 h-8" /> :
                                verificationType === 'phone' ? <Smartphone className="w-8 h-8" /> :
                                    <KeyRound className="w-8 h-8" />}
                        </div>
                        <h3 className="text-2xl font-serif text-alma-text mb-2">Verificación de seguridad</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Hemos enviado un código de 6 dígitos a <br />
                            <span className="font-bold text-gray-700">
                                {/* 📱 MOSTRAMOS EL DATO CORRECTO */}
                                {verificationType === 'email' ? formData.email :
                                    verificationType === 'phone' ? formData.phone :
                                        user.email}
                            </span>.
                        </p>

                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
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
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirmar código'}
                            </button>
                            <button
                                onClick={() => { setShowCodeModal(false); setVerificationCode(''); setMessage({ type: '', text: '' }); }}
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

export default UserProfile;