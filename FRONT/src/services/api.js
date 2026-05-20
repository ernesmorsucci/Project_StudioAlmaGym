import axios from 'axios';

const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:8080/', // La URL de tu backend
  withCredentials: true // ¡Súper importante! Esto permite que el navegador guarde la cookie JWT
});

export default api;