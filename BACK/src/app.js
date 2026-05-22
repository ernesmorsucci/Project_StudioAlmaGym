import './utils/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; // 👈 LIBRERÍA RESTAURADA
import { createServer } from 'http'; 
import { Server } from 'socket.io';  
import { startCronJobs } from './utils/cron.js';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
import holidayRouter from './routes/holiday.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true
};

const cookieOptions = {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
};
const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
};

// 2. CONEXIÓN EXPLÍCITA A MONGODB (Evita el timeout)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/almagym';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🟢 Base de datos MongoDB conectada exitosamente'))
  .catch(err => console.error('🔴 Error conectando a MongoDB:', err));

// 3. CONFIGURACIÓN DE SOCKET.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: corsOptions
});

export { io };

// 4. MIDDLEWARES GLOBALES
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

// Custom mongoSanitize para Express 5 (evita el crash de req.query)
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
    next();
});

// 4.1 LIMITADOR DE TASA (Rate Limiting) Global
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 800, // Límite alto para navegación normal (evita ataques DDos)
    message: { error: "Límite de peticiones excedido, por favor intenta de nuevo más tarde." }
});
app.use('/api/', apiLimiter);

// 5. CORS
app.use(cors(corsOptions));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'almagym-api' });
});

app.locals.cookieOptions = cookieOptions;
app.locals.clearCookieOptions = clearCookieOptions;


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
app.use('/api/holidays', holidayRouter);

startCronJobs();
// 7. INICIALIZACIÓN DEL SERVIDOR
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor Studio Alma encendido en el puerto ${PORT}`);
});
