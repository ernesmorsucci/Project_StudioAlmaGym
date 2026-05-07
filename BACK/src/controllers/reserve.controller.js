import { reserveService, classService, membershipService } from "../services/index.service.js";

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

// 4. Crear Reserva (Maneja cupos y lista de espera)
export const createReserve = async (req, res) => {
    try {
        const { studentId, classId, membershipId } = req.body;

        if (!studentId || !classId || !membershipId) {
            return res.status(400).json({ status: "error", error: "Faltan datos obligatorios" });
        }

        // A. Traemos la clase para ver si hay lugar
        const targetClass = await classService.getBy({ _id: classId });
        if (!targetClass) return res.status(404).json({ status: "error", error: "Clase no encontrada" });

        // B. Verificamos si hay cupo
        const hasQuota = targetClass.occupiedQuota < targetClass.maxQuota;

        let newReserveData = {
            studentId,
            classId,
            status: 'confirmed',
            assistance: 'pending',
            waitingPosition: 0
        };

        if (hasQuota) {
            // SI HAY LUGAR: Se confirma, se ocupa un cupo en la clase y se descuenta un crédito al alumno
            await classService.incrementOccupiedQuota(classId, 1);
            await membershipService.incrementUsedClasses(membershipId);
        } else {
            // SI NO HAY LUGAR: Va a lista de espera
            // Calculamos qué posición le toca averiguando cuántos están ya en espera
            const currentPending = await reserveService.findByClass(classId);
            const pendingCount = currentPending.filter(r => r.status === 'pending').length;
            
            newReserveData.status = 'pending';
            newReserveData.waitingPosition = pendingCount + 1;
        }

        const result = await reserveService.create(newReserveData);
        res.status(201).json({ status: "success", payload: result, message: hasQuota ? "Reserva confirmada" : "Añadido a lista de espera" });

    } catch (error) {
        // En MongoDB, si el índice "unique" salta porque el alumno ya estaba anotado, tirará un error 11000
        if (error.code === 11000) {
            return res.status(400).json({ status: "error", error: "El alumno ya está inscripto en esta clase" });
        }
        console.error("Error en createReserve:", error);
        res.status(500).json({ status: "error", error: "Error al generar la reserva" });
    }
};

// 5. Cancelar Reserva (Maneja devolución de créditos y adelanta lista de espera)
export const cancelReserve = async (req, res) => {
    try {
        const { rid } = req.params; // ID de la reserva
        const { membershipId } = req.body; // Necesitamos el ID de la membresía para devolverle el crédito

        const reserve = await reserveService.getBy({ _id: rid });
        if (!reserve || reserve.status === 'canceled') {
            return res.status(404).json({ status: "error", error: "Reserva no válida o ya cancelada" });
        }

        // A. Cancelamos la reserva actual
        await reserveService.update(rid, { status: 'canceled', waitingPosition: 0 });

        if (reserve.status === 'confirmed') {
            // B. Si estaba confirmada, liberamos el cupo de la clase y devolvemos el crédito al alumno
            await classService.decrementOccupiedQuota(reserve.classId, 1);
            if (membershipId) await membershipService.decrementUsedClasses(membershipId);

            // C. Lógica de Lista de Espera: Buscamos si hay alguien esperando
            const nextInLine = await reserveService.getNextInWaitingList(reserve.classId);
            
            if (nextInLine) {
                // Confirmamos al primero de la lista
                await reserveService.confirmWaitingReservation(nextInLine._id);
                // Volvemos a ocupar el cupo en la clase que acabábamos de liberar
                await classService.incrementOccupiedQuota(reserve.classId, 1);
                // Movemos a todos los demás de la lista un lugar hacia adelante
                await reserveService.shiftWaitingList(reserve.classId, 1);
                
                // NOTA MENTAL: Aquí podríamos disparar un email/notificación al alumno 'nextInLine.studentId' avisándole que entró.
            }
        } else if (reserve.status === 'pending') {
            // Si estaba en lista de espera y se arrepiente, solo adelantamos a los que estaban detrás de él
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
            return res.status(400).json({ status: "error", error: "Estado de asistencia inválido" });
        }

        const result = await reserveService.markAttendance(rid, assistance);
        if (!result) return res.status(404).json({ status: "error", error: "Reserva no encontrada" });

        res.status(200).json({ status: "success", message: "Asistencia registrada", payload: result });
    } catch (error) {
        console.error("Error en markAttendance:", error);
        res.status(500).json({ status: "error", error: "Error al registrar la asistencia" });
    }
};