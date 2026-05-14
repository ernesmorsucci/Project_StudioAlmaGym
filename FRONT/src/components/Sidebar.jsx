import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Calendar, Users, Clock, CreditCard, Bell, LogOut, UserCircle, BookmarkCheck } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const userRole = (user?.role || user?.rol)?.toLowerCase();

  // 1. Menú de Alumnos (¡AQUÍ ESTÁN LAS NUEVAS PESTAÑAS!)
  const studentLinks = [
    { path: '/inicio', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { path: '/inicio?tab=agendar', label: 'Reservar clase', icon: <Calendar className="w-5 h-5" /> },
    { path: '/inicio?tab=mis-reservas', label: 'Mis Reservas', icon: <BookmarkCheck className="w-5 h-5" /> },
    { path: '/inicio?tab=pagos', label: 'Pagos', icon: <CreditCard className="w-5 h-5" /> },
    { path: '/inicio?tab=notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
    { path: '/inicio?tab=mi-perfil', label: 'Perfil', icon: <UserCircle className="w-5 h-5" /> },
  ];

  // 2. Menú de Admin
  const adminLinks = [
    { path: '/admin?tab=dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/admin?tab=alumnos', label: 'Alumnos', icon: <Users className="w-5 h-5" /> },
    { path: '/admin?tab=horarios', label: 'Horarios', icon: <Clock className="w-5 h-5" /> },
    { path: '/admin?tab=pagos', label: 'Pagos', icon: <CreditCard className="w-5 h-5" /> },
    { path: '/admin?tab=notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
    { path: '/admin?tab=profesoras', label: 'Profesoras', icon: <UserCircle className="w-5 h-5" /> },
    { path: '/admin?tab=planes', label: 'Planes', icon: <CreditCard className="w-5 h-5" /> },
  ];

  // 3. Menú de Profesoras
  const professorLinks = [
    { path: '/profesor', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { path: '/profesor?tab=clases', label: 'Mis clases', icon: <Calendar className="w-5 h-5" /> },
    { path: '/profesor?tab=horas', label: 'Horas trabajadas', icon: <Clock className="w-5 h-5" /> },
    { path: '/profesor?tab=alumnos', label: 'Alumnos', icon: <Users className="w-5 h-5" /> },
  ];

  const links = userRole === 'admin' ? adminLinks : userRole === 'profesor' ? professorLinks : studentLinks;

  // Función inteligente para que los botones se pinten de verde
  const isLinkActive = (path) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');

    if (userRole === 'admin') {
      const activeAdminTab = currentTab || 'dashboard';
      return path.includes(`tab=${activeAdminTab}`);
    } else if (userRole === 'profesor') {
      if (!location.pathname.startsWith('/profesor')) return false;
      if (path.includes('?tab=')) {
        const linkTab = path.split('?tab=')[1];
        return currentTab === linkTab;
      }
      return !currentTab || currentTab === 'inicio';
    } else {
      if (path.includes('?tab=')) {
        const linkTab = path.split('?tab=')[1];
        return currentTab === linkTab && location.pathname.startsWith('/inicio');
      } else {
        return location.pathname === path && (!currentTab || currentTab === 'inicio');
      }
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-8">
        <h1 className="text-2xl font-serif tracking-widest text-alma-text uppercase">Studio Alma</h1>
      </div>

      {(userRole === 'admin' || userRole === 'profesor') && (
        <div className="px-8 pb-3">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
            {userRole === 'admin' ? 'Administración' : 'Mis herramientas'}
          </span>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
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
