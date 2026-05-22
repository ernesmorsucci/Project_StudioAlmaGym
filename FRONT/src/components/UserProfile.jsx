import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Smartphone, CheckCircle, AlertCircle, KeyRound, Mail, Loader, Lock } from 'lucide-react';
import { showSuccess, showError, showConfirm } from '../utils/alerts'; 

const UserProfile = () => {
    const { user } = useAuth(); // Ya no dependemos de setUser global
    
    // 🔥 NUEVA FUENTE DE LA VERDAD ABSOLUTA
    const [dbUser, setDbUser] = useState(user);

    const [personalData, setPersonalData] = useState({ name: '' });
    const [securityData, setSecurityData] = useState({ email: '', newPassword: '' });
    const [phoneData, setPhoneData] = useState({ phone: '' });

    useEffect(() => {
        const fetchFreshUserData = async () => {
            if (user?._id) {
                try {
                    const res = await api.get(`/users/${user._id}`);
                    const freshUser = res.data.payload;
                    
                    // 1. Guardamos la verdad absoluta para usarla en la pantalla
                    setDbUser(freshUser);
                    
                    // 2. Rellenamos los inputs
                    setPersonalData({ name: freshUser.name || '' });
                    setSecurityData({ email: freshUser.email || '', newPassword: '' });
                    setPhoneData({ phone: freshUser.phone || '' });
                } catch (error) {
                    console.error("Error al obtener datos frescos:", error);
                }
            }
        };
        fetchFreshUserData();
    }, [user?._id]);

    const [loading, setLoading] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationType, setVerificationType] = useState(''); 
    const [pendingSecurityChange, setPendingSecurityChange] = useState(null);

    // ==========================================
    // 1. GUARDADO DIRECTO
    // ==========================================
    const handleSavePersonal = async (e) => {
        e.preventDefault();
        if (personalData.name === dbUser?.name) return; 

        setLoading(true);
        try {
            const res = await api.put(`/users/${dbUser?._id}`, { name: personalData.name });
            setDbUser(res.data.payload); // Actualizamos la pantalla con la respuesta
            showSuccess('Nombre actualizado correctamente.');
        } catch (error) {
            showError(error.response?.data?.error || 'Error al actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 2. FLUJO DE WHATSAPP
    // ==========================================
    const handleSendPhoneCode = async () => {
        if (!phoneData.phone) return;
        if (phoneData.phone === dbUser?.phone && dbUser?.isPhoneVerified) return; 

        setLoading(true);
        try {
            await api.post('/users/send-phone-code', { phone: phoneData.phone });
            setVerificationType('phone');
            setShowCodeModal(true);
        } catch (error) {
            showError(error.response?.data?.error || 'Error al solicitar el código por SMS.');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 3. SEGURIDAD: EMAIL Y CONTRASEÑA
    // ==========================================
    const handleSecurityChange = async (type) => {
        setLoading(true);
        try {
            if (type === 'email') {
                const isSameEmail = securityData.email === dbUser?.email;
                
                if (isSameEmail && dbUser?.isEmailVerified) {
                    setLoading(false);
                    return;
                }
                
                await api.post('/users/request-update-code', { 
                    newEmail: isSameEmail ? null : securityData.email, 
                    changingPassword: false 
                });
                
                setPendingSecurityChange({ email: securityData.email });
                setVerificationType('email');
                
            } else if (type === 'password') {
                if (!securityData.newPassword.trim()) return setLoading(false);

                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
                if (!passwordRegex.test(securityData.newPassword)) {
                    setLoading(false);
                    return showError('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.');
                }
                
                await api.post('/users/request-update-code', { newEmail: null, changingPassword: true });
                setPendingSecurityChange({ password: securityData.newPassword });
                setVerificationType('password');
            }
            
            setShowCodeModal(true);
        } catch (error) {
            showError(error.response?.data?.error || 'Error al solicitar autorización.');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LA GRAN MODAL VALIDADORA
    // ==========================================
    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6 || loading) return;

        setLoading(true);
        try {
            if (verificationType === 'phone') {
                await api.post('/users/verify-phone-code', { code: verificationCode });
                // Actualizamos forzosamente nuestra fuente local
                setDbUser({ ...dbUser, isPhoneVerified: true, phone: phoneData.phone });
                showSuccess('¡WhatsApp verificado con éxito! 📱');

            } else {
                const res = await api.post('/users/verify-update', {
                    code: verificationCode,
                    updates: pendingSecurityChange
                });
                
                // 🔥 Inyectamos los datos frescos del backend directo a la pantalla
                setDbUser(res.data.payload);
                
                showSuccess(verificationType === 'password' 
                    ? '¡Contraseña cambiada de forma segura! 🔐' 
                    : '¡Email verificado correctamente! 📧'
                );
                
                setSecurityData({ ...securityData, newPassword: '' });
            }

            setShowCodeModal(false);
            setVerificationCode('');
            setPendingSecurityChange(null);
        } catch (error) {
            showError(error.response?.data?.error || 'Código incorrecto o expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-10 max-w-2xl">
            <h2 className="text-4xl font-serif text-alma-text mb-2">Mi perfil</h2>
            <p className="text-gray-500 mb-8">Administra tu información personal y la seguridad de tu cuenta.</p>

            <div className="grid grid-cols-1 gap-6">
                
                {/* 1. SECCIÓN: DATOS BÁSICOS */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <CheckCircle className="w-5 h-5 text-alma-olive"/> Información General
                    </h3>
                    <form onSubmit={handleSavePersonal} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Nombre completo</label>
                            <input 
                                type="text" 
                                required
                                value={personalData.name} 
                                onChange={(e) => setPersonalData({ name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none text-gray-700" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || personalData.name === dbUser?.name}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 h-fit"
                        >
                            Guardar
                        </button>
                    </form>
                </div>

                {/* 2. SECCIÓN: CONTACTO & WHATSAPP */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Smartphone className="w-5 h-5 text-alma-olive"/> Comunicación
                    </h3>
                    
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between">
                                <span>Teléfono (WhatsApp)</span>
                                {dbUser?.phone && (
                                    dbUser?.isPhoneVerified 
                                    ? <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-black"><CheckCircle className="w-3 h-3"/> Verificado</span>
                                    : <span className="text-amber-500 flex items-center gap-1 text-[10px] uppercase font-black"><AlertCircle className="w-3 h-3"/> Pendiente</span>
                                )}
                            </label>
                            <input 
                                type="text" 
                                placeholder="+54 9 261 ..."
                                value={phoneData.phone} 
                                onChange={(e) => setPhoneData({ phone: e.target.value })}
                                disabled={dbUser?.isPhoneVerified}
                                className={`w-full p-3 border rounded-xl outline-none transition-all ${dbUser?.isPhoneVerified ? 'border-green-100 bg-green-50/30 text-gray-500' : 'border-gray-300 focus:ring-2 focus:ring-alma-olive text-gray-700'}`} 
                            />
                        </div>
                        
                        {dbUser?.isPhoneVerified ? (
                            <button 
                                onClick={() => {
                                    showConfirm({ title: '¿Cambiar número?', text: 'Perderás la verificación actual.' }).then(res => {
                                        if(res) setDbUser({...dbUser, isPhoneVerified: false});
                                    });
                                }}
                                className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors h-fit text-sm"
                            >
                                Cambiar
                            </button>
                        ) : (
                            <button 
                                onClick={handleSendPhoneCode}
                                disabled={!phoneData.phone || loading}
                                className="bg-alma-olive text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 h-fit text-sm shadow-sm"
                            >
                                Validar SMS
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. SECCIÓN: ZONA DE SEGURIDAD (EMAIL Y CONTRASEÑA) */}
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Lock className="w-5 h-5 text-red-500"/> Zona de Seguridad
                    </h3>
                    
                    <div className="space-y-6">
                        {/* CAMBIO DE EMAIL */}
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between">
                                    <span>Correo Electrónico Principal</span>
                                    {dbUser?.isEmailVerified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-black"><CheckCircle className="w-3 h-3"/> Verificado</span>
                                    ) : (
                                        <span className="text-amber-500 flex items-center gap-1 text-[10px] uppercase font-black"><AlertCircle className="w-3 h-3"/> Pendiente</span>
                                    )}
                                </label>
                                <input 
                                    type="email" 
                                    value={securityData.email} 
                                    onChange={(e) => setSecurityData({ ...securityData, email: e.target.value })}
                                    className={`w-full p-3 border rounded-xl outline-none transition-all ${dbUser?.isEmailVerified ? 'border-gray-300 focus:ring-2 focus:ring-red-300 text-gray-700' : 'border-amber-200 focus:ring-2 focus:ring-amber-400 text-gray-700'}`} 
                                />
                            </div>
                            
                            {securityData.email === dbUser?.email && !dbUser?.isEmailVerified ? (
                                <button 
                                    onClick={() => handleSecurityChange('email')}
                                    disabled={loading}
                                    className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 h-fit text-sm shadow-sm"
                                >
                                    Verificar Email
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleSecurityChange('email')}
                                    disabled={securityData.email === dbUser?.email || loading}
                                    className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 h-fit text-sm"
                                >
                                    Cambiar Email
                                </button>
                            )}
                        </div>

                        {/* CAMBIO DE CONTRASEÑA */}
                        <div className="flex gap-4 items-end pt-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Nueva Contraseña Segura</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={securityData.newPassword} 
                                    onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-300 outline-none text-gray-700 placeholder-gray-300" 
                                />
                            </div>
                            <button 
                                onClick={() => handleSecurityChange('password')}
                                disabled={!securityData.newPassword.trim() || loading}
                                className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 h-fit text-sm shadow-sm"
                            >
                                Actualizar Clave
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                            * Por seguridad, cualquier cambio en esta sección requerirá confirmación enviando un código a tu correo actual ({dbUser?.email}).
                        </p>
                    </div>
                </div>

            </div>

            {/* MODAL DE VERIFICACIÓN 2FA */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-alma-olive/10 text-alma-olive rounded-full flex items-center justify-center mx-auto mb-4">
                            {verificationType === 'email' ? <Mail className="w-8 h-8" /> : 
                             verificationType === 'phone' ? <Smartphone className="w-8 h-8" /> : 
                             <KeyRound className="w-8 h-8" />}
                        </div>
                        <h3 className="text-2xl font-serif text-alma-text mb-2">Código de Seguridad</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Escribe el código de 6 dígitos que enviamos a tu <br/>
                            <span className="font-bold text-gray-700">
                                {verificationType === 'phone' ? phoneData.phone : dbUser?.email}
                            </span>.
                        </p>

                        <input 
                            type="text" 
                            maxLength="6"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none mb-6"
                        />

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleVerifyCode}
                                disabled={verificationCode.length !== 6 || loading}
                                className="w-full bg-alma-olive text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin"/> : 'Confirmar Autorización'}
                            </button>
                            <button 
                                onClick={() => { setShowCodeModal(false); setVerificationCode(''); setPendingSecurityChange(null); }}
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