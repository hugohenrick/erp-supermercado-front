import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import TenantRegisterPage from './pages/auth/TenantRegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import BranchListPage from './pages/branches/BranchListPage';
import BranchFormPage from './pages/branches/BranchFormPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-tenant" element={<TenantRegisterPage />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        {/* Rotas de Filiais */}
        <Route path="/branches" element={
          <ProtectedRoute>
            <BranchListPage />
          </ProtectedRoute>
        } />
        <Route path="/branches/new" element={
          <ProtectedRoute>
            <BranchFormPage />
          </ProtectedRoute>
        } />
        <Route path="/branches/edit/:id" element={
          <ProtectedRoute>
            <BranchFormPage />
          </ProtectedRoute>
        } />
        
        {/* Rotas de Clientes */}
        <Route path="/customers" element={
          <ProtectedRoute>
            <CustomerListPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/new" element={
          <ProtectedRoute>
            <CustomerFormPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/edit/:id" element={
          <ProtectedRoute>
            <CustomerFormPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/view/:id" element={
          <ProtectedRoute>
            <CustomerFormPage viewOnly={true} />
          </ProtectedRoute>
        } />
        
        {/* Redirecionar para login se a rota não existir */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App; 