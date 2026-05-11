import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Calendar, Users, Clock, CreditCard, Bell, LogOut, UserCircle } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = (user?.role || user?.rol)?.toLowerCase();

  // 1. Menú de Alumnos
  const studentLinks = [
    { path: '/inicio', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { path: '/reservar', label: 'Reservar clase', icon: <Calendar className="w-5 h-5" /> },
  ];

  // 2. Menú de Admin (Manejado por parámetros en la URL para no crear múltiples archivos)
  const adminLinks = [
    { path: '/admin?tab=dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/admin?tab=alumnos', label: 'Alumnos', icon: <Users className="w-5 h-5" /> },
    { path: '/admin?tab=horarios', label: 'Horarios', icon: <Clock className="w-5 h-5" /> },
    { path: '/admin?tab=pagos', label: 'Pagos', icon: <CreditCard className="w-5 h-5" /> },
    { path: '/admin?tab=notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
    { path: '/admin?tab=profesoras', label: 'Profesoras', icon: <UserCircle className="w-5 h-5" /> },
  ];

  const links = userRole === 'admin' ? adminLinks : studentLinks;

  // Función para determinar si el botón del menú debe pintarse de verde
  const isLinkActive = (path) => {
    if (userRole === 'admin') {
      const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      return path.includes(`tab=${currentTab}`);
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-8">
        <h1 className="text-2xl font-serif tracking-widest text-alma-text uppercase">Studio Alma</h1>
      </div>

      {/* Etiqueta de ADMINISTRACIÓN (Solo visible para admin) */}
      {userRole === 'admin' && (
        <div className="px-8 pb-3">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Administración</span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const active = isLinkActive(link.path);
          return (
            <NavLink
              key={link.label}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-alma-olive text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-alma-text'
              }`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Perfil y Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-gray-800 truncate">{user?.name}</span>
            <span className="text-xs text-gray-500 capitalize">{userRole}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;