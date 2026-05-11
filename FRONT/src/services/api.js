import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // La URL de tu backend
  withCredentials: true // ¡Súper importante! Esto permite que el navegador guarde la cookie JWT
});

export default api;