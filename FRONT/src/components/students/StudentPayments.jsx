import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, Landmark, Smartphone, X, Copy } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StudentPayments = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [membership, setMembership] = useState(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Buscamos los pagos
            const paymentsRes = await api.get(`/payments/student/${user._id}`).catch(() => ({ data: { payload: [] } }));

            // 🔥 2. EL ARREGLO: Cambiamos /user/ por /student/ para que coincida con tu backend
            const membershipRes = await api.get(`/memberships/student/${user._id}`).catch(() => ({ data: { payload: null } }));

            const sortedPayments = (paymentsRes.data.payload || []).sort((a, b) => new Date(b.date) - new Date(a.date));

            setPayments(sortedPayments);
            setMembership(membershipRes.data.payload);
        } catch (error) {
            console.error("Error al cargar pagos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-alma-olive w-10 h-10" />
        </div>
    );

    // Cálculos para la vista
    const lastPayment = payments.length > 0 ? payments[0] : null;

    // Formateadores de fecha (Ej: "10 jul")
    const formatDayMonth = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleDateString('es-AR', { month: 'short' }).toLowerCase()}`;
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        let str = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
        return str.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); // Capitaliza meses
    };

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <h2 className="text-4xl font-serif text-alma-text mb-8">Pagos</h2>

            {/* TARJETAS SUPERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Tarjeta: Próximo Vencimiento */}
                <div className="bg-white rounded-3xl border border-alma-olive/30 p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-alma-olive"></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Próximo Vencimiento</h4>

                    <div className="mb-6">
                        <span className="text-5xl font-serif text-alma-text block mb-1">
                            {membership ? formatDayMonth(membership.expireDate) : 'Sin plan'}
                        </span>
                        {membership && (
                            <span className="text-sm text-gray-500">
                                ${membership.planId?.price || '0'} · {membership.planId?.name || 'Plan Actual'}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="bg-alma-olive text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-opacity-90 transition-all"
                    >
                        Pagar ahora
                    </button>
                </div>

                {/* Tarjeta: Último Pago */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Último Pago</h4>

                    {lastPayment ? (
                        <div>
                            <span className="text-5xl font-serif text-alma-text block mb-1">
                                {formatDayMonth(lastPayment.date)}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                ${lastPayment.amount} · <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Acreditado
                            </span>
                        </div>
                    ) : (
                        <div className="pt-2">
                            <span className="text-gray-400 italic">No hay registros de pagos anteriores.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* TABLA: HISTORIAL DE PAGOS */}
            <div className="bg-white rounded-[1.5rem] border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Historial de pagos</h3>

                {payments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4">Aún no tienes historial de pagos registrado.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                    <th className="pb-4 font-black">Fecha</th>
                                    <th className="pb-4 font-black">Plan</th>
                                    <th className="pb-4 font-black">Monto</th>
                                    <th className="pb-4 font-black">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map(payment => (
                                    <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 text-gray-600">{formatFullDate(payment.date)}</td>
                                        <td className="py-5 font-medium text-gray-700">{payment.planId?.name || 'Suscripción'}</td>
                                        <td className="py-5 text-gray-600 font-medium">${payment.amount}</td>
                                        <td className="py-5">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Pagado
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DE TRANSFERENCIA POP-UP */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-serif text-2xl text-alma-text flex items-center gap-2">
                                <Landmark className="w-6 h-6 text-alma-olive" /> Datos de Pago
                            </h3>
                            <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-gray-600 text-sm">
                                Para renovar tu membresía, realiza una transferencia a la siguiente cuenta bancaria.
                            </p>

                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 relative">
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titular</span>
                                    <span className="text-gray-800 font-medium">Studio Alma Gym S.A.</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">CBU / CVU</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800 font-mono tracking-wider text-lg">
                                            {import.meta.env.VITE_BANK_CBU || "CBU no configurado"}
                                        </span>
                                        <button onClick={() => copyToClipboard(import.meta.env.VITE_BANK_CBU)} className="...">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alias</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800 font-bold text-lg">
                                            {import.meta.env.VITE_BANK_ALIAS || "Alias no configurado"}
                                        </span>
                                        <button onClick={() => copyToClipboard(import.meta.env.VITE_BANK_ALIAS)} className="...">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {copied && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded shadow-sm animate-fade-in">
                                        ¡Copiado!
                                    </div>
                                )}
                            </div>

                            <div className="bg-alma-olive/10 p-4 rounded-2xl flex items-start gap-4">
                                <Smartphone className="w-6 h-6 text-alma-olive shrink-0 mt-1" />
                                <div className="text-sm text-gray-700">
                                    <p className="font-bold mb-1">Paso Final</p>
                                    <p>Una vez realizada la transferencia, envíanos el comprobante por WhatsApp al <strong>{import.meta.env.VITE_WHATSAPP_DISPLAY}</strong> indicando tu nombre completo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPayments;
