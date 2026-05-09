import { reserveService, classService, membershipService, planService } from "../services/index.service.js";

// ==========================================
// MÉTODOS DE LECTURA (GET)
// ==========================================

// 1. Obtener todas las reservas (Para el Admin)
export const getAllReserves = async (req, res) => {
    try {
        const reserves = await reserveService.getAll();
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error en getAllReserves:", error);
        res.status(500).json({ status: "error", error: "Error al obtener las reservas" });
    }
};

// 2. Obtener reservas de un alumno (Para "Mis Clases" en el panel del alumno)
export const getStudentReservations = async (req, res) => {
    try {
        const { uid } = req.params;
        const requestingUser = req.user;

        // 🛡️ ESCUDO DE PRIVACIDAD
        if (requestingUser._id !== uid && requestingUser.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "Acceso denegado: Solo puedes ver tus propias reservas" });
        }

        const reserves = await reserveService.findUserReservations(uid);
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error en getStudentReservations:", error);
        res.status(500).json({ status: "error", error: "Error al obtener reservas del alumno" });
    }
};

// 3. Obtener inscriptos de una clase (Para que la Profesora tome asistencia)
export const getClassReservations = async (req, res) => {
    try {
        const { cid } = req.params;
        const reserves = await reserveService.findByClass(cid);
        res.status(200).json({ status: "success", payload: reserves });
    } catch (error) {
        console.error("Error en getClassReservations:", error);
        res.status(500).json({ status: "error", error: "Error al obtener inscriptos de la clase" });
    }
};

// ==========================================
// MÉTODOS DE NEGOCIO (EL CORE DEL SISTEMA)
// ==========================================

/**
 * CDU-01: Crear Reserva
 * 
 * SEGURIDAD:
 * - studentId se obtiene del token (req.user._id), nunca del body.
 * - membershipId se busca en la DB a partir del studentId del token.
 * Esto impide que un alumno use la membresía de otro para reservar.
 * 
 * VALIDACIONES:
 * 1. Verifica que el alumno tenga membresía activa.
 * 2. Verifica que no haya alcanzado el límite mensual del plan.
 * 3. Verifica que no esté ya inscripto en la clase.
 * 4. Si hay cupo: confirma. Si no: lista de espera.
 */
export const createReserve = async (req, res) => {
    try {
        const { classId } = req.body;

        // studentId siempre del token, nunca del body
        const studentId = req.user._id;

        if (!classId) {
            return res.status(400).json({ status: "error", error: "Falta el ID de la clase" });
        }

        // Paso 1: Buscar la membresía activa del alumno autenticado
        const membership = await membershipService.getBy({ studentId, status: 'active' });
        if (!membership) {
            return res.status(403).json({ status: "error", error: "No tenés una membresía activa para reservar clases" });
        }

        // Paso 2: Buscar el plan para saber el límite mensual de clases
        const planData = await planService.getBy({ _id: membership.planId });

        if (planData && membership.usedClassesThisMonth >= planData.weeklyClasses) {
            return res.status(403).json({ 
                status: "error", 
                error: `Alcanzaste el límite de clases de tu plan este mes (${planData.weeklyClasses} clases)` 
            });
        }

        // Paso 3: Verificar si ya existe una reserva activa para este alumno en esta clase
        const existingReserve = await reserveService.getBy({ 
            studentId, 
            classId, 
            status: { $ne: 'canceled' } 
        });
        if (existingReserve) {
            return res.status(400).json({ status: "error", error: "Ya estás inscripto en esta clase" });
        }

        // Paso 4: Verificar cupo de la clase
        const targetClass = await classService.getBy({ _id: classId });
        if (!targetClass) return res.status(404).json({ status: "error", error: "Clase no encontrada" });
        if (!targetClass.isActive) return res.status(400).json({ status: "error", error: "La clase no está disponible" });

        const hasQuota = targetClass.occupiedQuota < targetClass.maxQuota;

        let newReserveData = {
            studentId,
            classId,
            status: 'confirmed',
            assistance: 'pending',
            waitingPosition: 0
        };

        if (hasQuota) {
            // Hay lugar: confirmar y descontar crédito mensual
            await classService.incrementOccupiedQuota(classId, 1);
            await membershipService.incrementUsedClasses(membership._id);
        } else {
            // Sin lugar: lista de espera (no se descuenta crédito)
            const pendingList = await reserveService.findByClass(classId);
            const pendingCount = pendingList.filter(r => r.status === 'pending').length;
            newReserveData.status = 'pending';
            newReserveData.waitingPosition = pendingCount + 1;
        }

        const result = await reserveService.create(newReserveData);
        res.status(201).json({ 
            status: "success", 
            payload: result, 
            message: hasQuota ? "Reserva confirmada" : `Añadido a lista de espera (posición ${newReserveData.waitingPosition})` 
        });

    } catch (error) {
        console.error("Error en createReserve:", error);
        res.status(500).json({ status: "error", error: "Error al generar la reserva" });
    }
};

/**
 * CDU-02: Cancelar Reserva
 * 
 * SEGURIDAD:
 * - membershipId se busca en la DB a partir del studentId del token.
 * - No se acepta membershipId del body.
 * - Solo el dueño de la reserva o un admin pueden cancelarla.
 */
export const cancelReserve = async (req, res) => {
    try {
        const { rid } = req.params;
        const user = req.user;

        // Paso 1: Buscar la reserva
        const reserve = await reserveService.getBy({ _id: rid });
        if (!reserve || reserve.status === 'canceled') {
            return res.status(404).json({ status: "error", error: "Reserva no válida o ya cancelada" });
        }

        // 🛡️ ESCUDO DE SEGURIDAD: solo el dueño o un admin pueden cancelar
        if (reserve.studentId.toString() !== user._id && user.rol !== 'admin') {
            return res.status(403).json({ status: "error", error: "No tenés permiso para cancelar esta reserva" });
        }

        // Paso 2: Buscar la membresía activa del dueño de la reserva
        // (buscamos por el studentId de la reserva, no del que cancela, por si es el admin)
        const membership = await membershipService.getBy({ 
            studentId: reserve.studentId, 
            status: 'active' 
        });

        // Paso 3: Cancelar la reserva
        await reserveService.update(rid, { status: 'canceled', waitingPosition: 0 });

        if (reserve.status === 'confirmed') {
            // Liberar cupo de la clase
            await classService.decrementOccupiedQuota(reserve.classId, 1);

            // Devolver crédito mensual solo si tiene membresía activa
            if (membership) {
                await membershipService.decrementUsedClasses(membership._id);
            }

            // CDU-02: Buscar al siguiente en lista de espera
            const nextInLine = await reserveService.getNextInWaitingList(reserve.classId);
            
            if (nextInLine) {
                // Validar que el siguiente tenga membresía activa antes de confirmarlo
                const nextMembership = await membershipService.getBy({ 
                    studentId: nextInLine.studentId, 
                    status: 'active' 
                });

                if (nextMembership) {
                    // Confirmar al siguiente y descontarle su crédito
                    await reserveService.confirmWaitingReservation(nextInLine._id);
                    await classService.incrementOccupiedQuota(reserve.classId, 1);
                    await membershipService.incrementUsedClasses(nextMembership._id);
                    await reserveService.shiftWaitingList(reserve.classId, 1);
                    // TODO: disparar notificación push/WhatsApp a nextInLine.studentId
                } else {
                    // El siguiente no tiene membresía activa: se lo saltea y se adelanta la lista
                    await reserveService.update(nextInLine._id, { status: 'canceled', waitingPosition: 0 });
                    await reserveService.shiftWaitingList(reserve.classId, 1);
                    console.warn(`Alumno ${nextInLine.studentId} saltado en lista de espera: sin membresía activa`);
                }
            }

        } else if (reserve.status === 'pending') {
            // Estaba en lista de espera: solo adelantar a los que estaban detrás
            await reserveService.shiftWaitingList(reserve.classId, reserve.waitingPosition);
        }

        res.status(200).json({ status: "success", message: "Reserva cancelada correctamente" });

    } catch (error) {
        console.error("Error en cancelReserve:", error);
        res.status(500).json({ status: "error", error: "Error al cancelar la reserva" });
    }
};

// 6. Tomar Asistencia (Profesora / Admin)
export const markAttendance = async (req, res) => {
    try {
        const { rid } = req.params;
        const { assistance } = req.body; // 'assisted' o 'absent'

        if (!['assisted', 'absent'].includes(assistance)) {
            return res.status(400).json({ status: "error", error: "Estado de asistencia inválido. Usar 'assisted' o 'absent'" });
        }

        const result = await reserveService.markAttendance(rid, assistance);
        if (!result) return res.status(404).json({ status: "error", error: "Reserva no encontrada" });

        res.status(200).json({ status: "success", message: "Asistencia registrada", payload: result });
    } catch (error) {
        console.error("Error en markAttendance:", error);
        res.status(500).json({ status: "error", error: "Error al registrar la asistencia" });
    }
};