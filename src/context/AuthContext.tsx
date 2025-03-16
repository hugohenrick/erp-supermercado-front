import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, User, AuthResponse } from '../services/api';

// Não precisamos mais estender a interface User, já que estamos usando diretamente da API
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  tenantId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('tenantId'));
  
  // Verificar status de autenticação quando o componente é montado
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Tentar obter dados do usuário atual
          const userData = await authService.getCurrentUser();
          setUser(userData as User);
          
          // Atualizar o tenantId do estado com o valor do localStorage
          const storedTenantId = localStorage.getItem('tenantId');
          if (storedTenantId) {
            setTenantId(storedTenantId);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário', error);
          
          // Se o token expirou, tentar renovar
          try {
            await authService.refreshToken();
            const userData = await authService.getCurrentUser();
            setUser(userData as User);
          } catch (refreshError) {
            console.error('Erro ao renovar token', refreshError);
            // Se falhar, remover token e forçar login
            authService.logout();
          }
        }
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Chama o serviço de autenticação para fazer login (agora simplificado)
      const response = await authService.login({ 
        email, 
        password
      });
      
      // Atualiza o estado com os dados do usuário
      setUser(response.user);
      
      // Se houver tenant_id na resposta, atualiza o estado
      if (response.tenant_id) {
        setTenantId(response.tenant_id);
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Falha na autenticação. Verifique suas credenciais.';
      
      // Extrair mensagem de erro da resposta, se disponível
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Marcar o erro como tratado para evitar duplicação
      const handledError = new Error(errorMessage);
      (handledError as any).handled = true;
      throw handledError;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Implementação do registro se necessário
    // Como não temos detalhes do endpoint de registro no exemplo fornecido,
    // mantemos a implementação anterior ou criar uma simulação
    return true;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setTenantId(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
    error,
    tenantId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}; 