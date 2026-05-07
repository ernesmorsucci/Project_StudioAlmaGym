import "./utils/env.js";  
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import authRouter from "./routes/auth.routes.js";
import connectDB from "./utils/db.js";
import usersRouter from "./routes/users.routes.js";
import classRouter from "./routes/class.routes.js";
import membershipRouter from "./routes/membership.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import planRouter from "./routes/plan.routes.js";
import recurrentRouter from "./routes/recurrentSchedule.routes.js";
import reserveRouter from "./routes/reserve.routes.js";
import notificationRouter from "./routes/notification.routes.js";



if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no definido en .env");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/classes", classRouter);
app.use("/api/memberships", membershipRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/plan", planRouter);
app.use("/api/schedules", recurrentRouter);
app.use("/api/reserves", reserveRouter);
app.use("/api/notifications", notificationRouter);

app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRouter);

let io;

const startServer = async () => {
    try {
        await connectDB();

        const httpServer = app.listen(PORT, () =>
            console.log(`Servidor en puerto ${PORT}`)
        );

        io = new Server(httpServer, {
            cors: { origin: "http://localhost:5173", credentials: true }
        });

        io.on("connection", (socket) => {
            console.log("Cliente conectado al WebSocket:", socket.id);

            socket.on("disconnect", () => {
                console.log("Cliente desconectado:", socket.id);
            });
        });

    } catch (error) {
        console.error("Error al iniciar el servidor:", error.message);
        process.exit(1);
    }
};

startServer();

export { io };