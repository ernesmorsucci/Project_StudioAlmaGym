import React, { useState, useEffect } from 'react';
import { Banknote, Landmark, User, CreditCard, Search, CheckCircle } from 'lucide-react';
import api from '../services/api';

const PaymentManager = () => {
    const [students, setStudents] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [paymentData, setPaymentData] = useState({
        studentId: '',
        planId: '',
        amount: '',
        method: 'Transferencia'
    });

    // Cargar alumnos y planes al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, plansRes] = await Promise.all([
                    api.get('/users/students-dashboard'),
                    api.get('/plans/active')
                ]);
                setStudents(studentsRes.data.payload || []);
                setPlans(plansRes.data.payload || []);
            } catch (error) {
                console.error("Error al cargar datos para pagos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Manejar el cambio de plan para autocompletar el monto
    const handlePlanChange = (e) => {
        const selectedPlanId = e.target.value;
        const selectedPlan = plans.find(p => p._id === selectedPlanId);
        setPaymentData({
            ...paymentData,
            planId: selectedPlanId,
            amount: selectedPlan ? selectedPlan.price : ''
        });
    };

    const handleConfirmPayment = async () => {
        if (!paymentData.studentId || !paymentData.planId || !paymentData.amount) {
            return alert("Por favor complete todos los campos obligatorios.");
        }

        setIsSubmitting(true);
        try {
            // Disparamos al backend unificado que revisamos en tu controlador
            await api.post('/payments', {
                studentId: paymentData.studentId,
                planId: paymentData.planId,
                amount: Number(paymentData.amount),
                method: paymentData.method
            });

            setSuccessMessage('¡Pago registrado y membresía actualizada con éxito!');
            
            // Limpiar formulario
            setPaymentData({ studentId: '', planId: '', amount: '', method: 'Transferencia' });
            
            // Ocultar mensaje después de 3 segundos
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error al procesar el pago:", error);
            alert(error.response?.data?.error || "Hubo un error al procesar el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-gray-400 animate-pulse py-10">Cargando módulo de pagos...</div>;

    return (
        <div className="animate-fade-in max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-serif text-alma-text">Registrar Nuevo Cobro</h2>
                <p className="text-sm text-gray-500 mt-1">Selecciona un alumno, asigna su plan e ingresa el pago.</p>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* SECCIÓN 1: Selección de Alumno */}
                    <div className="md:col-span-2 border-b border-gray-100 pb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-alma-olive"/> 1. Seleccionar Alumno
                        </label>
                        <select 
                            value={paymentData.studentId}
                            onChange={(e) => setPaymentData({...paymentData, studentId: e.target.value})}
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none bg-white text-gray-700"
                        >
                            <option value="">Buscar alumno por nombre...</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name} - {student.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SECCIÓN 2: Selección de Plan */}
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

                    {/* SECCIÓN 3: Monto */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. Monto final ($)</label>
                        <input 
                            type="number" 
                            value={paymentData.amount} 
                            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} 
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-alma-olive outline-none font-serif text-lg" 
                            placeholder="Ej: 30000" 
                        />
                    </div>

                    {/* SECCIÓN 4: Método de Pago (Reutilizando tu UI) */}
                    <div className="md:col-span-2 pt-2">
                        <label className="block text-sm font-bold text-gray-700 mb-3">4. Método de Pago</label>
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

                <div className="mt-10 flex justify-end">
                    <button 
                        onClick={handleConfirmPayment} 
                        disabled={!paymentData.studentId || !paymentData.planId || !paymentData.amount || isSubmitting} 
                        className="bg-alma-olive text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all text-lg w-full md:w-auto"
                    >
                        {isSubmitting ? 'Procesando...' : 'Confirmar e Ingresar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentManager;