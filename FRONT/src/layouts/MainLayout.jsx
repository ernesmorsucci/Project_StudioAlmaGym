import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
// Importamos los íconos de la librería lucide-react
import { Home, Calendar, CheckSquare, CreditCard, Bell, Settings } from 'lucide-react';

// Datos de prueba (Hardcodeados). ¡Luego los traeremos de nuestro backend!
const dummyUser = {
  name: 'María García',
  role: 'Plan 2x semana'
};

const studentLinks = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/reservar', label: 'Reservar clase', icon: Calendar },
  { to: '/mis-reservas', label: 'Mis reservas', icon: CheckSquare },
  { to: '/pagos', label: 'Pagos', icon: CreditCard },
  { to: '/notificaciones', label: 'Notificaciones', icon: Bell },
  { to: '/perfil', label: 'Mi perfil', icon: Settings },
];

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-alma-bg flex">
      {/* Menú Fijo a la Izquierda */}
      <Sidebar links={studentLinks} user={dummyUser} />

      {/* Área Principal de Contenido (Le damos un margen izquierdo de 64 = w-64 del Sidebar) */}
      <main className="ml-64 flex-1 p-8">
        {/* Aquí adentro es donde React Router inyectará las diferentes pantallas */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;