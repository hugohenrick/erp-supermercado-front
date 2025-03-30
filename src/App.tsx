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
import UserListPage from './pages/users/UserListPage';
import UserFormPage from './pages/users/UserFormPage';
import CertificateListPage from './pages/certificates/CertificateListPage';
import CertificateFormPage from './pages/certificates/CertificateFormPage';
import ChatAssistantWrapper from './components/chat/ChatAssistantWrapper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import { Box, CircularProgress, Typography } from '@mui/material';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        flexDirection="column"
        sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verificando autenticação...
        </Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Componente de chat que só é renderizado quando o usuário está autenticado
const AuthenticatedChatAssistant = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <ChatAssistantWrapper />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
          <SidebarProvider>
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
              
              {/* Rotas de Usuários */}
              <Route path="/users" element={
                <ProtectedRoute>
                  <UserListPage />
                </ProtectedRoute>
              } />
              <Route path="/users/new" element={
                <ProtectedRoute>
                  <UserFormPage />
                </ProtectedRoute>
              } />
              <Route path="/users/edit/:id" element={
                <ProtectedRoute>
                  <UserFormPage />
                </ProtectedRoute>
              } />
              <Route path="/users/view/:id" element={
                <ProtectedRoute>
                  <UserFormPage viewOnly={true} />
                </ProtectedRoute>
              } />
              
              {/* Rotas de Certificados */}
              <Route path="/certificates" element={
                <ProtectedRoute>
                  <CertificateListPage />
                </ProtectedRoute>
              } />
              <Route path="/certificates/new" element={
                <ProtectedRoute>
                  <CertificateFormPage />
                </ProtectedRoute>
              } />
              <Route path="/certificates/edit/:id" element={
                <ProtectedRoute>
                  <CertificateFormPage />
                </ProtectedRoute>
              } />
              <Route path="/certificates/view/:id" element={
                <ProtectedRoute>
                  <CertificateFormPage viewOnly={true} />
                </ProtectedRoute>
              } />
              
              {/* Redirecionar para login se a rota não existir */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            {/* Componente de Chat - renderizado apenas quando o usuário está autenticado */}
            <AuthenticatedChatAssistant />
          </SidebarProvider>
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 