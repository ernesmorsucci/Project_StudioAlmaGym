import axios from 'axios';

const api = axios.create({
  baseURL: "https://project-studioalmagym.onrender.com/api" || "http://localhost:8080/api",
  withCredentials: true, // ¡Súper importante! Esto permite que el navegador guarde la cookie JWT
  timeout: 10000
});

export default api;
