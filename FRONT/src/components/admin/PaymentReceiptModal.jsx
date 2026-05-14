import React from 'react';
import { X, Download, Printer, CheckCircle } from 'lucide-react';

const PaymentReceiptModal = ({ payment, onClose }) => {
    // Cálculo de vigencia
    const startDate = new Date(payment.createdAt || payment.date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // FUNCIÓN DE IMPRESIÓN RÁPIDA
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-alma-text/40 backdrop-blur-sm">
            {/* ID PARA EL CSS DE IMPRESIÓN */}
            <div id="printable-receipt" className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-in">
                
                {/* Header del Recibo */}
                <div className="bg-alma-olive p-8 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-serif">Comprobante de Pago</h3>
                        <p className="text-white/70 text-sm mt-1 uppercase tracking-widest font-bold">Studio Alma Gym</p>
                    </div>
                    {/* Clase no-print para que la X no salga en el PDF */}
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors no-print">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-between border-b border-gray-100 pb-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">No. de Recibo</p>
                            <p className="font-mono text-lg text-gray-800">#{payment._id?.slice(-6).toUpperCase() || 'TEMP'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Emisión</p>
                            <p className="text-gray-800 font-medium">{new Date(payment.createdAt || payment.date).toLocaleDateString('es-AR')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Alumna</p>
                            <p className="text-xl font-serif text-alma-text">{payment.studentId?.name || 'N/A'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Plan Abonado</p>
                                <p className="text-sm font-bold text-alma-text">{payment.planId?.name || 'Plan Studio'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Método</p>
                                <p className="text-sm font-bold text-alma-text">{payment.method}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Período de Vigencia</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-bold">{startDate.toLocaleDateString('es-AR')}</span>
                                <span>—</span>
                                <span className="font-bold">{endDate.toLocaleDateString('es-AR')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center bg-alma-olive/5 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-alma-olive uppercase">Total Percibido</p>
                            <p className="text-3xl font-serif text-alma-olive">${payment.amount?.toLocaleString('es-AR')}</p>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN (Clase no-print) */}
                    <div className="flex gap-3 pt-4 no-print">
                        <button 
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-all"
                        >
                            <Download className="w-4 h-4"/> Guardar como PDF / Imprimir
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 italic">
                        <CheckCircle className="w-3 h-3 text-green-500"/> Transacción procesada por el sistema administrativo de Studio Alma Gym
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceiptModal;