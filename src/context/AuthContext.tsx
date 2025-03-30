import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, User, AuthResponse } from '../services/api';
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Inicialize como true para evitar flash de conteúdo não autenticado
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('tenantId'));
  
  // Verificar status de autenticação quando o componente é montado
  useEffect(() => {
    // Verificar se o localStorage está funcionando corretamente
    const testLocalStorage = () => {
      try {
        // Teste de escrita e leitura no localStorage
        const testKey = 'localStorageTest';
        const testValue = 'test-' + Date.now();
        
        // Tentar gravar
        localStorage.setItem(testKey, testValue);
        
        // Tentar ler
        const retrievedValue = localStorage.getItem(testKey);
        
        // Verificar se o valor lido é igual ao valor gravado
        const isWorking = retrievedValue === testValue;
        
        // Limpar o teste
        localStorage.removeItem(testKey);
        
        if (!isWorking) {
          console.error('ALERTA: localStorage não está funcionando corretamente');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('ERRO CRÍTICO: localStorage não está disponível:', error);
        return false;
      }
    };
    
    const checkAuthStatus = async () => {
      // Verificar se o localStorage está funcionando
      if (!testLocalStorage()) {
        console.error('Não é possível prosseguir com a autenticação: localStorage indisponível');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Log do estado atual do localStorage para diagnóstico
      console.log('=== DIAGNÓSTICO DO LOCAL STORAGE ===');
      console.log('token presente:', Boolean(localStorage.getItem('token')));
      console.log('refresh token presente:', Boolean(localStorage.getItem('refreshToken')));
      console.log('tenant ID presente:', Boolean(localStorage.getItem('tenantId')));
      console.log('branch ID presente:', Boolean(localStorage.getItem('branchId')));
      console.log('===================================');
      
      // Recuperar tokens do localStorage diretamente (evitar possíveis problemas de referência)
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token && !refreshToken) {
        console.log('Sem tokens disponíveis, usuário não está autenticado');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Primeiro nível: tentar obter o usuário com o token atual
        if (token) {
          try {
            console.log('Verificando token existente:', token.substring(0, 10) + '...');
            const userData = await authService.getCurrentUser();
            console.log('Usuário obtido com sucesso:', userData.name);
            
            setUser(userData as User);
            
            // Atualizar o tenantId do estado com o valor do localStorage
            const storedTenantId = localStorage.getItem('tenantId');
            if (storedTenantId) {
              setTenantId(storedTenantId);
            }
            
            setIsLoading(false);
            return; // Sucesso, não precisa tentar refresh
          } catch (getUserError: any) {
            console.warn('Erro ao obter usuário atual:', getUserError.message || getUserError);
            
            // Se o erro for 401 (Não Autorizado), precisamos tentar renovar o token
            const isUnauthorized = getUserError.response && getUserError.response.status === 401;
            
            if (!isUnauthorized) {
              console.error('Erro não relacionado à autorização ao obter usuário');
              throw getUserError; // Propagar erros não relacionados à autorização
            }
            
            // Continuar para tentar refresh token
          }
        }
        
        // Segundo nível: token inválido ou expirado, tentar refresh
        if (refreshToken) {
          try {
            console.log('Tentando renovar o token usando refresh token:', refreshToken.substring(0, 10) + '...');
            
            // Aqui vamos chamar diretamente o serviço de refresh usando axios para evitar problemas
            // com interceptores ou outras complicações
            const API_BASE_URL = '/api/v1';
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refresh_token: refreshToken
            }, {
              headers: {
                'Content-Type': 'application/json',
                'tenant-id': localStorage.getItem('tenantId'),
                'branch-id': localStorage.getItem('branchId')
              }
            });
            
            console.log('Resposta do refresh token:', response.status, response.data);
            
            // Extrair o novo token
            const newToken = response.data.access_token || response.data.token;
            
            if (!newToken) {
              throw new Error('Token não retornado na resposta');
            }
            
            // Limpar localStorage antes de adicionar novos tokens
            localStorage.removeItem('token');
            
            console.log('Token renovado com sucesso!');
            localStorage.setItem('token', newToken);
            
            // Verificar se o token foi armazenado corretamente
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
              console.error('ERRO: Falha ao armazenar o novo token no localStorage');
              throw new Error('Falha ao armazenar o novo token');
            }
            
            // Se houver um novo refresh token, salve-o
            if (response.data.refresh_token) {
              localStorage.setItem('refreshToken', response.data.refresh_token);
            }
            
            // Atualizar informações do tenant e branch, se disponíveis
            if (response.data.user?.tenant_id) {
              localStorage.setItem('tenantId', response.data.user.tenant_id);
            }
            
            if (response.data.user?.branch_id) {
              localStorage.setItem('branchId', response.data.user.branch_id);
            }
            
            // Com o token renovado, obter dados do usuário
            const userData = await authService.getCurrentUser();
            console.log('Usuário obtido após renovação de token:', userData.name);
            
            setUser(userData as User);
            
            // Atualizar o tenantId do estado
            const storedTenantId = localStorage.getItem('tenantId');
            if (storedTenantId) {
              setTenantId(storedTenantId);
            }
          } catch (refreshError: any) {
            console.error('Falha ao renovar o token ou obter usuário após renovação:', refreshError);
            console.error('Detalhes do erro:', refreshError.response?.data);
            
            // Falha no refresh, limpar autenticação
            setUser(null);
            setTenantId(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tenantId');
            localStorage.removeItem('branchId');
          }
        } else {
          console.log('Sem refresh token disponível');
          
          // Não temos refresh token, então limpar autenticação
          setUser(null);
          setTenantId(null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tenantId');
          localStorage.removeItem('branchId');
        }
      } catch (error) {
        console.error('Erro durante verificação de autenticação:', error);
        
        // Limpar estado de autenticação em caso de erro
        setUser(null);
        setTenantId(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('branchId');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Adicionar pequeno delay para garantir que o localStorage esteja pronto
    setTimeout(() => {
      checkAuthStatus();
    }, 100);
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
    console.log('Realizando logout...');
    
    // Limpar todos os dados de autenticação do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('branchId');
    localStorage.removeItem('activeBranch');
    
    // Limpar estado do contexto
    setUser(null);
    setTenantId(null);
    
    // Disparar evento para notificar outros componentes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('logout'));
    
    console.log('Logout concluído com sucesso');
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