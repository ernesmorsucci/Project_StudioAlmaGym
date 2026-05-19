import React, { useState, useEffect } from 'react';
import { 
    Banknote, 
    Landmark, 
    User, 
    CreditCard, 
    AlertCircle, 
    TrendingUp, 
    Calendar, 
    ArrowLeft, 
    FileText, 
    CheckCircle 
} from 'lucide-react';
import api from '../../services/api';
import PaymentReceiptModal from './PaymentReceiptModal';
import { showError, showWarning, showSuccess } from '../../utils/alerts';

const PaymentManager = () => {
    // ESTADOS DE VISTA Y MODALES
    const [view, setView] = useState('history'); // 'history' o 'register'
    const [selectedPayment, setSelectedPayment] = useState(null); 
    
    // ESTADOS DE DATOS
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState({ totalRecaudado: 0, recaudadoMes: 0 });
    
    // ESTADOS DE CARGA Y FORMULARIO
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState({
        studentId: '',
        planId: '',
        amount: '',
        method: 'Transferencia'
    });

    // CARGA INICIAL DE DATOS
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [studentsRes, plansRes, paymentsRes, statsRes] = await Promise.all([
                api.get('/users/students-dashboard'),
                api.get('/plans/active'),
                api.get('/payments'),
                api.get('/payments/stats')
            ]);
            
            setStudents(studentsRes.data.payload || []);
            setPlans(plansRes.data.payload || []);
            setPayments(paymentsRes.data.payload || []);
            setStats(statsRes.data.payload || { totalRecaudado: 0, recaudadoMes: 0 });
        } catch (error) {
            console.error("Error al cargar datos financieros:", error);
        } finally {
            setLoading(false);
        }
    };

    // LÓGICA DE NEGOCIO: CÁLCULO DE DEUDA PENDIENTE
    const totalPendiente = students
        .filter(s => s.status === 'Vencida' || s.status === 'Sin plan')
        .reduce((acc, student) => {
            const plan = plans.find(p => p.name === student.plan);
            return acc + (plan ? plan.price : 0);
        }, 0);

    // AUTOCOMPLETAR MONTO AL SELECCIONAR PLAN
    const handlePlanChange = (e) => {
        const selectedPlanId = e.target.value;
        const selectedPlan = plans.find(p => p._id === selectedPlanId);
        setPaymentData({
            ...paymentData,
            planId: selectedPlanId,
            amount: selectedPlan ? selectedPlan.price : ''
        });
    };

    // PROCESAR NUEVO COBRO
    const handleConfirmPayment = async () => {
        if (!paymentData.studentId || !paymentData.planId || !paymentData.amount) {
            return showWarning("Por favor complete todos los campos obligatorios.");
        }

        setIsSubmitting(true);
        try {
            await api.post('/payments', {
                ...paymentData,
                amount: Number(paymentData.amount)
            });

            // notificacion de pago
            try {
                const receiptData = {
                    subject: "Pago Confirmado",
                    message: `Se confirmó el pago de $${paymentData.amount} por el plan seleccionado.`,
                    targetType: "student",
                    resolvedIds: [paymentData.studentId]
                };
                await api.post('/notifications', receiptData);
                showSuccess("Pago registrado y notificación enviada al estudiante");
            } catch (notifError) {
                console.error("Advertencia: Error al enviar notificación:", notifError);
                showWarning("Pago registrado pero fallo el envío de notificación. Revisa la conexión de email.");
            }

            //LIMPIAR FORMULARIO Y ACTUALIZAR DATOS
            setPaymentData({ studentId: '', planId: '', amount: '', method: 'Transferencia' });
            await fetchInitialData(); // Recargamos todo para actualizar las tarjetas y la tabla
            setView('history'); // Volvemos al historial automáticamente
        } catch (error) {
            console.error("Error al procesar el pago:", error);
            showError(error.response?.data?.error || "Hubo un error al procesar el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-alma-olive border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Cargando módulo financiero...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            
            {/* ========================================== */}
            {/* CABECERA DINÁMICA                          */}
            {/* ========================================== */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-serif text-alma-text">
                        {view === 'history' ? 'Resumen Financiero' : 'Registrar Nuevo Cobro'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {view === 'history' ? 'Monitorea los ingresos, deudas y comprobantes emitidos.' : 'Completa los datos para generar el recibo oficial.'}
                    </p>
                </div>
                <button 
                    onClick={() => setView(view === 'history' ? 'register' : 'history')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-alma-olive text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-sm"
                >
                    {view === 'history' ? <><CreditCard className="w-4 h-4"/> Nuevo Cobro</> : <><ArrowLeft className="w-4 h-4"/> Volver al Resumen</>}
                </button>
            </div>

            {/* ========================================== */}
            {/* TARJETAS DE INDICADORES (Siempre visibles) */}
            {/* ========================================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                
                {/* Tarjeta: Recaudado Histórico */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-alma-olive">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-alma-olive">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Histórico</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Recaudado</p>
                    <h4 className="text-3xl font-serif text-alma-text mt-1">
                        ${stats.totalRecaudado.toLocaleString('es-AR')}
                    </h4>
                </div>

                {/* Tarjeta: Pendientes de Cobro */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-red-400">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Por Cobrar</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Saldos Pendientes</p>
                    <h4 className="text-3xl font-serif text-red-600 mt-1">
                        ${totalPendiente.toLocaleString('es-AR')}
                    </h4>
                </div>

                {/* Tarjeta: Pagos del Mes */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-alma-warning">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-50 rounded-2xl text-alma-warning">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date().toLocaleDateString('es-AR', { month: 'long' })}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
                    <h4 className="text-3xl font-serif text-alma-text mt-1">
                        ${stats.recaudadoMes.toLocaleString('es-AR')}
                    </h4>
                </div>
            </div>

            {/* ========================================== */}
            {/* VISTAS CONDICIONALES: HISTORIAL O FORMULARIO*/}
            {/* ========================================== */}
            {view === 'history' ? (
                
                /* TABLA DE HISTORIAL DE PAGOS */
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto animate-fade-in">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-tighter">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Alumna</th>
                                <th className="px-6 py-4">Plan Abonado</th>
                                <th className="px-6 py-4">Monto</th>
                                <th className="px-6 py-4">Método</th>
                                <th className="px-6 py-4 text-right">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                                        No hay pagos registrados todavía.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(p.createdAt || p.date).toLocaleDateString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-alma-text">
                                            {p.studentId?.name || 'Alumna eliminada'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {p.planId?.name || 'Plan personalizado'}
                                        </td>
                                        <td className="px-6 py-4 font-serif text-lg font-bold text-gray-800">
                                            ${p.amount?.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                {p.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedPayment(p)}
                                                className="inline-flex items-center justify-center p-2 text-alma-olive hover:bg-alma-olive/10 hover:text-alma-oliveHover rounded-lg transition-all"
                                                title="Ver Comprobante"
                                            >
                                                <FileText className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            ) : (

                /* FORMULARIO DE NUEVO COBRO */
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-4xl animate-fade-in">
                    <h4 className="text-lg font-serif text-alma-text mb-6 border-b border-gray-100 pb-4">Detalles del Nuevo Ingreso</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Alumna */}
                        <div className="md:col-span-2 border-b border-gray-100 pb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-alma-olive"/> 1. Seleccionar Alumna
                            </label>
                            <select 
                                value={paymentData.studentId}
                                onChange={(e) => setPaymentData({...paymentData, studentId: e.target.value})}
                                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none bg-white text-gray-700"
                            >
                                <option value="">Buscar alumna por nombre...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} - Estado: {student.status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Plan */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-alma-olive"/> 2. Seleccionar Plan
                            </label>
                            <select 
                                value={paymentData.planId}
                                onChange={handlePlanChange}
                                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none bg-white text-gray-700"
                            >
                                <option value="">Seleccione el plan a abonar...</option>
                                {plans.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Monto */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">3. Monto final a cobrar ($)</label>
                            <input 
                                type="number" 
                                value={paymentData.amount} 
                                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} 
                                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none font-serif text-lg text-gray-800" 
                                placeholder="Ej: 30000" 
                            />
                        </div>

                        {/* 4. Método */}
                        <div className="md:col-span-2 pt-2">
                            <label className="block text-sm font-bold text-gray-700 mb-3">4. Método de Pago utilizado</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setPaymentData({...paymentData, method: 'Transferencia'})} 
                                    className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentData.method === 'Transferencia' ? 'border-alma-olive bg-alma-olive/10 text-alma-olive font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Landmark className="w-5 h-5"/> Transferencia
                                </button>
                                <button 
                                    onClick={() => setPaymentData({...paymentData, method: 'Efectivo'})} 
                                    className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentData.method === 'Efectivo' ? 'border-alma-olive bg-alma-olive/10 text-alma-olive font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Banknote className="w-5 h-5"/> Efectivo
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-4">
                        <button 
                            onClick={() => setView('history')} 
                            className="px-6 py-3.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmPayment} 
                            disabled={!paymentData.studentId || !paymentData.planId || !paymentData.amount || isSubmitting} 
                            className="bg-alma-olive text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all text-lg flex items-center gap-2"
                        >
                            {isSubmitting ? 'Procesando...' : <><CheckCircle className="w-5 h-5"/> Registrar e Imprimir Recibo</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL DE RECIBO (Comprobante Visual)       */}
            {/* ========================================== */}
            {selectedPayment && (
                <PaymentReceiptModal 
                    payment={selectedPayment} 
                    onClose={() => setSelectedPayment(null)} 
                />
            )}
            
        </div>
    );
};

export default PaymentManager;
