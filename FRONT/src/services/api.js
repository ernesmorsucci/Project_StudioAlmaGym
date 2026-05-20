import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: true // ¡Súper importante! Esto permite que el navegador guarde la cookie JWT
});

export default api;