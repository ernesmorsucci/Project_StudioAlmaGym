import './utils/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; // 👈 LIBRERÍA RESTAURADA
import { createServer } from 'http'; 
import { Server } from 'socket.io';  
import { startCronJobs } from './utils/cron.js';

// 1. IMPORTAMOS ROUTERS
import authRouter from './routes/auth.routes.js';
import classRouter from './routes/class.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import membershipRouter from './routes/membership.routes.js';
import notificationRouter from './routes/notification.routes.js';
import paymentRouter from './routes/payment.routes.js';
import planRouter from './routes/plan.routes.js';
import recurrentScheduleRouter from './routes/recurrentSchedule.routes.js';
import reserveRouter from './routes/reserve.routes.js';
import usersRouter from './routes/users.routes.js';


const app = express();

// 2. CONEXIÓN EXPLÍCITA A MONGODB (Evita el timeout)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/almagym';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🟢 Base de datos MongoDB conectada exitosamente'))
  .catch(err => console.error('🔴 Error conectando a MongoDB:', err));

// 3. CONFIGURACIÓN DE SOCKET.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }
});

export { io };

// 4. MIDDLEWARES GLOBALES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

// 5. CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));


// 6. ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/memberships', membershipRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/plans', planRouter);
app.use('/api/schedules', recurrentScheduleRouter);
app.use('/api/reserves', reserveRouter);
app.use('/api/users', usersRouter);


startCronJobs();
// 7. INICIALIZACIÓN DEL SERVIDOR
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor Studio Alma encendido en el puerto ${PORT}`);
});