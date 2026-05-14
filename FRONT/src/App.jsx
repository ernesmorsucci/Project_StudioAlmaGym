import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import StudentDashboard from "./pages/StudentDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import AdminDashboard from "./pages/AdminDashboard"; 
import Auth from "./pages/Auth";
import ResetPass from "./pages/ResetPass";

// 🛡️ PROTECTOR A PRUEBA DE BALAS (y de Spanglish)
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alma-olive"></div>
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;

  // 🔥 LA SOLUCIÓN: Buscamos "role" o "rol" dependiendo de cómo venga de la BD
  const userRole = (user.role || user.rol)?.toLowerCase() || '';

  if (!allowedRoles.includes(userRole)) {
    console.warn(`🛑 Acceso denegado: El rol '${userRole}' intentó entrar a una zona restringida.`);
    if (userRole === 'profesor') return <Navigate to="/profesor" replace />;
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/inicio" replace />;
  }

  return children;
};

// 🚦 REDIRECCIÓN INICIAL BASADA EN EL ROL
const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  
  const userRole = (user.role || user.rol)?.toLowerCase() || '';
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'profesor') return <Navigate to="/profesor" replace />;
  return <Navigate to="/inicio" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-pass" element={<Navigate to="/reset-pass" replace />} />
      <Route path="/reset-pass" element={<ResetPass />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<RoleRedirect />} />
        
        <Route 
          path="inicio" 
          element={
            <RoleProtectedRoute allowedRoles={['alumno']}>
              <StudentDashboard />
            </RoleProtectedRoute>
          } 
        />
        
        <Route 
          path="profesor" 
          element={
            <RoleProtectedRoute allowedRoles={['profesor', 'admin']}>
              <ProfessorDashboard />
            </RoleProtectedRoute>
          } 
        />
        
        <Route 
          path="admin" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } 
        />
        
        {/* 🔥 AQUI QUITAMOS EL COMPONENTE VIEJO DE <Reservations /> */}
        <Route path="reservar" element={<Navigate to="/inicio?tab=agendar" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;