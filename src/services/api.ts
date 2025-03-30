import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Definir se deve usar um proxy CORS ou não - desativado pois usamos o proxy do webpack
const USE_CORS_PROXY = false;

// URL base da API - usamos path relativo para aproveitar o proxy do webpack
const API_BASE_URL = '/api/v1';

// Cache de requisições para evitar duplicação
const requestCache: Record<string, { promise: Promise<any>, timestamp: number }> = {};

// Middleware para deduplica requisições em um curto período de tempo
export function deduplicateRequest<T>(
  key: string, 
  requestFn: () => Promise<T>, 
  ttl: number = 1000
): Promise<T> {
  const now = Date.now();
  const cacheEntry = requestCache[key];
  
  // Se existe uma requisição em andamento com o mesmo key e está dentro do TTL
  if (cacheEntry && (now - cacheEntry.timestamp < ttl)) {
    console.log(`Usando requisição em cache para ${key}. Idade: ${now - cacheEntry.timestamp}ms`);
    return cacheEntry.promise;
  }
  
  // Criar nova promise e armazenar no cache
  const promise = requestFn();
  
  // Guardar no cache
  requestCache[key] = {
    promise,
    timestamp: now
  };
  
  // Limpar do cache após o TTL
  promise.finally(() => {
    setTimeout(() => {
      if (requestCache[key]?.timestamp === now) {
        delete requestCache[key];
      }
    }, ttl);
  });
  
  return promise;
}

// Cria uma instância do axios com configurações base
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Configurar para usar credenciais, isso ajuda com a autenticação
  withCredentials: false
});

/* 
 * ALTERNATIVA EM CASO DE PROBLEMAS PERSISTENTES DE CORS
 * Se o proxy acima não funcionar, tente uma destas alternativas:
 * 
 * 1. cors-anywhere: 'https://cors-anywhere.herokuapp.com/' + API_BASE_URL
 * 2. allorigins: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(API_BASE_URL)
 * 3. Configurar um proxy local no package.json:
 *    "proxy": "http://localhost:8084"
 * 
 * IMPORTANTE: A melhor solução é configurar corretamente o CORS no backend:
 * 
 * No seu backend Go, adicione os seguintes cabeçalhos nas respostas:
 * - Access-Control-Allow-Origin: http://localhost:3000
 * - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
 * - Access-Control-Allow-Headers: Content-Type, Authorization, tenant-id
 * - Access-Control-Allow-Credentials: true
 */

// Ajusta a URL e modifica os cabeçalhos quando o proxy CORS é usado
const handleProxiedRequest = (config: any) => {
  return config;
};

// Variável global para armazenar o tenant-id atual
let currentTenantId: string | null = localStorage.getItem('tenantId');
// Variável global para armazenar o branch-id atual
let currentBranchId: string | null = localStorage.getItem('branchId');

// Listener para atualizar o tenant-id quando ele mudar no localStorage
window.addEventListener('storage', () => {
  const newTenantId = localStorage.getItem('tenantId');
  console.log('Evento storage: Tenant ID atualizado:', newTenantId);
  currentTenantId = newTenantId;
  
  const newBranchId = localStorage.getItem('branchId');
  console.log('Evento storage: Branch ID atualizado:', newBranchId);
  currentBranchId = newBranchId;
});

// Também ouvir um evento personalizado para atualizações manuais
window.addEventListener('tenant-id-updated', () => {
  const newTenantId = localStorage.getItem('tenantId');
  console.log('Evento tenant-id-updated: Tenant ID atualizado:', newTenantId);
  currentTenantId = newTenantId;
});

// Ouvir evento para atualizações de branch-id
window.addEventListener('branch-id-updated', () => {
  const newBranchId = localStorage.getItem('branchId');
  console.log('Evento branch-id-updated: Branch ID atualizado:', newBranchId);
  currentBranchId = newBranchId;
});

// Interceptor para adicionar token de autenticação e lidar com o proxy
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Usar o tenant-id da variável global, que é atualizada pelos listeners
    const tenantId = currentTenantId || localStorage.getItem('tenantId');
    // Usar o branch-id da variável global, que é atualizada pelos listeners
    const branchId = currentBranchId || localStorage.getItem('branchId');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      config.headers['tenant-id'] = tenantId;
      console.log(`Interceptor: Adicionando tenant-id (${tenantId}) ao cabeçalho da requisição para ${config.url}`);
      
      // Log mais detalhado para verificar o tenant-id em requisições específicas
      if (config.url?.includes('/setup/admin') || config.url?.includes('/tenants')) {
        console.log('REQUISIÇÃO IMPORTANTE - Detalhes completos:');
        console.log('URL:', config.url);
        console.log('Método:', config.method);
        console.log('tenant-id no cabeçalho:', tenantId);
        console.log('tenant-id atual no localStorage:', localStorage.getItem('tenantId'));
        console.log('tenant-id atual na variável global:', currentTenantId);
        console.log('Headers completos:', config.headers);
        if (config.data) {
          console.log('Payload:', JSON.stringify(config.data, null, 2));
        }
      }
    } else {
      console.warn(`Interceptor: tenant-id NÃO ENCONTRADO no localStorage para requisição ${config.url}`);
      console.warn('As requisições que exigem tenant-id podem falhar. Configure o tenant-id na tela de listagem de clientes.');
    }
    
    // Adicionar branch-id ao cabeçalho, se disponível
    if (branchId) {
      config.headers['branch-id'] = branchId;
      console.log(`Interceptor: Adicionando branch-id (${branchId}) ao cabeçalho da requisição para ${config.url}`);
    } else {
      console.warn(`Interceptor: branch-id NÃO ENCONTRADO no localStorage para requisição ${config.url}`);
      console.warn('As requisições que exigem branch-id podem falhar. Selecione uma filial ativa.');
    }
    
    // Converter dados para snake_case antes de enviar ao servidor
    if (config.data && (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
      // Não converter se for FormData
      if (!(config.data instanceof FormData)) {
        console.log('Convertendo dados de requisição para snake_case');
        config.data = convertToSnakeCase(config.data);
        console.log('Dados convertidos:', config.data);
      }
    }
    
    // Aplicar modificações necessárias para o proxy
    return handleProxiedRequest(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag para controlar se há um refresh de token em andamento
let isRefreshing = false;
// Array de callbacks para requisições que aguardam refresh de token
let refreshSubscribers: ((token: string) => void)[] = [];

// Função auxiliar para adicionar callbacks à fila de espera
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Função auxiliar para notificar todos os callbacks quando o token for atualizado
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Adicionar interceptor de resposta para converter de snake_case para camelCase
// e lidar com erros de autenticação
api.interceptors.response.use(
  (response) => {
    // Converter dados da resposta para camelCase
    if (response.data && !(response.data instanceof Blob)) {
      console.log('Convertendo dados de resposta para camelCase');
      response.data = convertToCamelCase(response.data);
      console.log('Dados convertidos:', response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log('Interceptor de resposta detectou erro:', error.response?.status);
    
    // Evitar loop infinito de tentativas de renovação de token
    if (originalRequest._retry) {
      console.log('Requisição já tentou refresh, rejeitando permanentemente');
      return Promise.reject(error);
    }
    
    // Se o erro for 401 (não autorizado) e não estamos já tentando renovar o token
    // e não é uma requisição para renovar token ou fazer login
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('refresh-token') &&
        !originalRequest.url?.includes('login')) {
      
      console.log('Erro 401 detectado, tentando refresh token...');
      
      // Se já estamos renovando o token, adicione esta requisição à fila
      if (isRefreshing) {
        console.log('Já existe um refresh em andamento, adicionando requisição à fila');
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      // Marcar como retry e iniciar processo de renovação
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Tenta renovar o token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('Refresh token não disponível no localStorage');
          throw new Error('Refresh token não disponível');
        }
        
        console.log('Enviando requisição de refresh token...');
        
        // Usar axios diretamente para evitar interceptores
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refresh_token: refreshToken
        }, {
          headers: {
            'Content-Type': 'application/json',
            'tenant-id': currentTenantId || localStorage.getItem('tenantId'),
            'branch-id': currentBranchId || localStorage.getItem('branchId')
          }
        });
        
        console.log('Resposta de refresh token recebida:', response.status);
        
        // Verificar se a resposta contém os tokens esperados
        if (!response.data.access_token) {
          console.error('Resposta de refresh não contém access_token:', response.data);
          throw new Error('Resposta de refresh inválida');
        }
        
        const newToken = response.data.access_token;
        localStorage.setItem('token', newToken);
        console.log('Novo token salvo no localStorage');
        
        // Se a resposta incluir um novo refresh token, armazene-o também
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
          console.log('Novo refresh token salvo no localStorage');
        }
        
        // Atualizar tenant ID se estiver na resposta
        if (response.data.user?.tenant_id) {
          localStorage.setItem('tenantId', response.data.user.tenant_id);
          currentTenantId = response.data.user.tenant_id;
          console.log('Tenant ID atualizado no localStorage:', response.data.user.tenant_id);
        }
        
        // Atualizar o token na requisição original e notificar outras requisições
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        
        console.log('Reexecutando requisição original com novo token');
        
        // Reenviar a requisição original com o novo token
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Falha ao renovar token:', refreshError);
        
        // Em caso de falha no refresh, limpar autenticação
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('branchId');
        
        console.log('Redirecionando para login após falha no refresh');
        
        // Redirecionar para login, se possível
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        // Resetar a flag, independentemente do resultado
        isRefreshing = false;
        console.log('Flag isRefreshing resetada:', isRefreshing);
      }
    }
    
    // Para outros erros, rejeitar normalmente
    return Promise.reject(error);
  }
);

// Enums
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CASHIER = 'CASHIER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

// Interfaces
export interface Tenant {
  id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status?: TenantStatus;
  schema?: string;
  planType: PlanType;
  maxBranches: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  tenantId?: string;
  branchId?: string;
  role?: UserRole;
  status?: UserStatus;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenant_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Serviço de autenticação
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('login: Iniciando processo de login para:', credentials.email);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      console.log('login: Resposta recebida, status:', response.status);
      
      // Verificar se a resposta contém os dados esperados
      if (!response.data) {
        console.error('login: Resposta vazia');
        throw new Error('Resposta vazia do servidor');
      }
      
      // Log da resposta completa para depuração (cuidado com informações sensíveis)
      console.log('login: Campos da resposta:', Object.keys(response.data));
      
      // Obter tokens dos campos corretos (compatível com diferentes formatos de API)
      const token = response.data.access_token || response.data.token;
      const refreshToken = response.data.refresh_token || response.data.refreshToken;
      
      if (!token) {
        console.error('login: Token não encontrado na resposta');
        throw new Error('Token não encontrado na resposta');
      }
      
      // Limpar o localStorage antes de adicionar novos tokens para evitar problemas
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      
      // Usar setTimeout para garantir que a operação de armazenamento seja concluída
      setTimeout(() => {
        try {
          console.log('login: Token obtido, salvando no localStorage');
          localStorage.setItem('token', token);
          
          if (refreshToken) {
            console.log('login: Refresh token obtido, salvando no localStorage');
            localStorage.setItem('refreshToken', refreshToken);
          } else {
            console.warn('login: Refresh token não encontrado na resposta');
          }
          
          // Extrair e salvar tenant_id do usuário, tentando diferentes caminhos possíveis
          let tenantId = null;
          if (response.data.user?.tenant_id) {
            tenantId = response.data.user.tenant_id;
          } else if (response.data.tenant_id) {
            tenantId = response.data.tenant_id;
          }
          
          if (tenantId) {
            console.log('login: Tenant ID obtido:', tenantId);
            localStorage.setItem('tenantId', tenantId);
            currentTenantId = tenantId;
            
            // Disparar eventos para notificar a mudança
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('tenant-id-updated'));
          } else {
            console.warn('login: Tenant ID não encontrado na resposta');
          }
          
          // Verificar se os tokens foram armazenados corretamente
          const storedToken = localStorage.getItem('token');
          const storedRefreshToken = localStorage.getItem('refreshToken');
          
          console.log('login: Verificação de armazenamento:');
          console.log('- Token armazenado:', Boolean(storedToken));
          console.log('- Refresh token armazenado:', Boolean(storedRefreshToken));
          
          if (!storedToken) {
            console.error('login: ALERTA! Token não foi armazenado corretamente no localStorage');
            // Tentar novamente
            localStorage.setItem('token', token);
          }
        } catch (storageError) {
          console.error('login: Erro ao armazenar tokens no localStorage:', storageError);
        }
      }, 0);
      
      // Extrair e salvar branch_id, se disponível
      let branchId = null;
      if (response.data.user?.branch_id) {
        branchId = response.data.user.branch_id;
      } else if (response.data.branch_id) {
        branchId = response.data.branch_id;
      }
      
      if (branchId) {
        console.log('login: Branch ID obtido:', branchId);
        localStorage.setItem('branchId', branchId);
        currentBranchId = branchId;
        
        // Disparar evento para notificar a mudança
        window.dispatchEvent(new CustomEvent('branch-id-updated'));
      }
      
      // Preparar objeto AuthResponse com os dados obtidos
      const authResponse: AuthResponse = {
        user: {
          id: response.data.user?.id,
          name: response.data.user?.name || '',
          email: response.data.user?.email || credentials.email,
          tenantId: response.data.user?.tenant_id || response.data.tenant_id,
          branchId: branchId,
          role: response.data.user?.role as UserRole,
          status: response.data.user?.status as UserStatus
        },
        token: token,
        refreshToken: refreshToken,
        tenant_id: response.data.user?.tenant_id || response.data.tenant_id
      };
      
      console.log('login: Processo de login concluído com sucesso');
      
      return authResponse;
    } catch (error: any) {
      console.error('login: Erro ao fazer login:', error.message);
      
      // Log detalhado da resposta de erro
      if (error.response) {
        console.error('login: Detalhes do erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },
  
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  },
  
  refreshToken: async (): Promise<{ token: string; refreshToken?: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('refreshToken: Refresh token não disponível no localStorage');
      throw new Error('Refresh token não disponível');
    }
    
    try {
      console.log('refreshToken: Iniciando processo de renovação de token');
      
      // Usar axios diretamente em vez da instância api para evitar interceptores
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': currentTenantId || localStorage.getItem('tenantId'),
          'branch-id': currentBranchId || localStorage.getItem('branchId')
        }
      });
      
      console.log('refreshToken: Resposta recebida', response.status);
      
      // Verificar e registrar a resposta completa para depuração
      console.log('refreshToken: Corpo da resposta', JSON.stringify(response.data, null, 2));
      
      // Obter token do campo correto (compatível com access_token ou token)
      const newToken = response.data.access_token || response.data.token;
      
      if (!newToken) {
        console.error('refreshToken: Token não encontrado na resposta');
        throw new Error('Token não encontrado na resposta');
      }
      
      console.log('refreshToken: Novo token obtido, atualizando localStorage');
      
      // Armazenar o novo token de acesso
      localStorage.setItem('token', newToken);
      
      // Se houver um novo refresh token, armazená-lo também
      let newRefreshToken = undefined;
      if (response.data.refresh_token) {
        newRefreshToken = response.data.refresh_token;
        localStorage.setItem('refreshToken', newRefreshToken);
        console.log('refreshToken: Novo refresh token armazenado');
      }
      
      // Atualizar informações do tenant, se presentes
      if (response.data.user?.tenant_id) {
        localStorage.setItem('tenantId', response.data.user.tenant_id);
        currentTenantId = response.data.user.tenant_id;
        console.log('refreshToken: Tenant ID atualizado:', response.data.user.tenant_id);
        
        // Disparar evento para notificar a atualização
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      }
      
      // Se houver branch_id, atualizá-lo também
      if (response.data.user?.branch_id) {
        localStorage.setItem('branchId', response.data.user.branch_id);
        currentBranchId = response.data.user.branch_id;
        console.log('refreshToken: Branch ID atualizado:', response.data.user.branch_id);
        
        // Disparar evento para notificar a atualização
        window.dispatchEvent(new CustomEvent('branch-id-updated'));
      }
      
      console.log('refreshToken: Processo de renovação concluído com sucesso');
      
      return { 
        token: newToken, 
        refreshToken: newRefreshToken
      };
    } catch (error: any) {
      console.error('refreshToken: Erro ao renovar token:', error.message);
      
      // Log detalhado da resposta de erro
      if (error.response) {
        console.error('refreshToken: Detalhes do erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      // Em caso de erro, limpar dados de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('branchId');
      
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('branchId');
  }
};

// Serviço de API para Tenants
export const tenantService = {
  // Função auxiliar para criar configuração com cabeçalho tenant-id
  _createTenantHeader: (tenantId?: string) => {
    if (!tenantId) return {};
    return {
      headers: {
        'tenant-id': tenantId
      }
    };
  },

  // Criar um novo tenant (empresa)
  createTenant: async (tenant: Tenant): Promise<Tenant> => {
    try {
      // Formatar o payload conforme esperado pelo backend com snake_case
      const payload = {
        name: tenant.name,
        document: tenant.document,
        email: tenant.email,
        phone: tenant.phone,
        plan_type: tenant.planType.toString(), // Usar snake_case conforme esperado pelo backend
        max_branches: Math.max(1, tenant.maxBranches), // Usar snake_case conforme esperado pelo backend
        status: tenant.status?.toString() 
      };
      
      console.log('Payload enviado para API:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/tenants', payload);
      console.log('Resposta da API:', response.data);
      
      // Converter a resposta de snake_case para camelCase
      const convertedResponse: Tenant = {
        id: response.data.id,
        name: response.data.name,
        document: response.data.document,
        email: response.data.email,
        phone: response.data.phone,
        status: response.data.status as TenantStatus,
        schema: response.data.schema,
        planType: response.data.plan_type as PlanType,
        maxBranches: response.data.max_branches,
        createdAt: response.data.created_at ? new Date(response.data.created_at) : undefined,
        updatedAt: response.data.updated_at ? new Date(response.data.updated_at) : undefined
      };
      
      // Atualizar o localStorage com o novo tenant ID
      if (convertedResponse.id) {
        console.log('Salvando novo tenant ID no localStorage:', convertedResponse.id);
        localStorage.setItem('tenantId', convertedResponse.id);
        
        // Atualizar a variável global e disparar eventos
        currentTenantId = convertedResponse.id;
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      }
      
      return convertedResponse;
    } catch (error: any) {
      console.error('Erro detalhado ao criar tenant:', error);
      
      // Log detalhado da resposta de erro, se disponível
      if (error.response) {
        console.error('Dados da resposta de erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },

  // Criar usuário administrador inicial (usando endpoint específico de setup)
  createAdminUser: async (user: User): Promise<User> => {
    try {
      if (!user.tenantId) {
        throw new Error('Tenant ID é obrigatório para criar usuário administrador');
      }

      // Formatar o payload conforme esperado pelo backend com snake_case
      const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        tenant_id: user.tenantId,
        role: UserRole.ADMIN, // Adicionar explicitamente a role ADMIN conforme exigido pelo backend
        status: UserStatus.ACTIVE, // Definir status como ACTIVE por padrão
        // Este endpoint específico não precisa de informações como branch_id, etc.
      };
      
      console.log('Payload enviado para API (createAdminUser):', JSON.stringify(payload, null, 2));
      
      // Garantir que o tenant-id no localStorage seja igual ao do usuário que está sendo criado
      if (localStorage.getItem('tenantId') !== user.tenantId) {
        console.log('Atualizando tenant ID no localStorage:', user.tenantId);
        localStorage.setItem('tenantId', user.tenantId);
        
        // Atualizar a variável global e disparar eventos
        currentTenantId = user.tenantId;
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      }
      
      // Criar configuração com o mesmo tenant-id
      let config = tenantService._createTenantHeader(user.tenantId);
      
      // Log mais detalhado dos cabeçalhos
      console.log('Cabeçalhos enviados para createAdminUser:', JSON.stringify(config, null, 2));
      
      // Adicionar log detalhado de debug da URL completa
      if (USE_CORS_PROXY) {
        console.log('Usando CORS proxy. URL completa:', 
          'https://cors-proxy.htmldriven.com/?' + encodeURIComponent(API_BASE_URL + '/setup/admin'));
      }
      
      // Verificação final: garantir que o tenant-id no cabeçalho corresponda ao tenant-id do usuário
      if (!config.headers || config.headers['tenant-id'] !== user.tenantId) {
        console.warn('AVISO: tenant-id no cabeçalho não corresponde ao tenant-id do usuário!');
        console.warn('Atualizando configuração de cabeçalho...');
        config = tenantService._createTenantHeader(user.tenantId);
      }
      
      const response = await api.post('/setup/admin', payload, config);
      console.log('Resposta da API (createAdminUser):', response.data);
      
      // Converter a resposta de snake_case para camelCase
      const convertedResponse: User = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        password: '', // Não retornamos a senha
        tenantId: response.data.tenant_id,
        role: UserRole.ADMIN, // Este endpoint sempre cria um admin
        status: UserStatus.ACTIVE
      };
      
      return convertedResponse;
    } catch (error: any) {
      console.error('Erro ao criar usuário administrador:', error);
      
      // Log detalhado da resposta de erro, se disponível
      if (error.response) {
        console.error('Dados da resposta de erro (createAdminUser):', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Verificar especificamente o erro 409 (Conflict) - Usuário admin já existe
        if (error.response.status === 409 && user.tenantId) {
          const tenantIdFromHeader = localStorage.getItem('tenantId');
          console.warn('Erro 409: Admin já existe. Verificando o tenant-id usado:');
          console.warn('tenant-id no payload:', user.tenantId);
          console.warn('tenant-id atual no localStorage:', tenantIdFromHeader);
          
          // Se o tenant-id no localStorage for diferente do fornecido no payload, isso pode ser a causa do erro
          if (tenantIdFromHeader !== user.tenantId) {
            console.error('INCOMPATIBILIDADE DETECTADA: tenant-id no localStorage é diferente do tenant-id no payload!');
            
            // Em caso de inconsistência, tente redefinir o tenant-id no localStorage e tentar novamente
            localStorage.setItem('tenantId', user.tenantId);
            currentTenantId = user.tenantId;
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('tenant-id-updated'));
            
            throw new Error(
              'Inconsistência detectada entre tenant-id no localStorage e no payload. ' + 
              'O tenant-id foi atualizado. Por favor, tente novamente.'
            );
          }
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Não houve resposta do servidor:', error.request);
      } else {
        // Erro na configuração da requisição
        console.error('Erro na configuração da requisição:', error.message);
      }
      
      throw error;
    }
  },

  // Criar um novo usuário associado ao tenant
  createUser: async (user: User): Promise<User> => {
    try {
      if (!user.tenantId) {
        throw new Error('Tenant ID é obrigatório para criar usuário');
      }

      // Formatar o payload conforme esperado pelo backend com snake_case
      const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        tenant_id: user.tenantId,
        branch_id: user.branchId || '', // Vazio se não fornecido
        // Definir o papel como ADMIN se isAdmin for true, caso contrário EMPLOYEE
        role: user.role || (user.isAdmin ? UserRole.ADMIN : UserRole.EMPLOYEE),
        // Definir status como ACTIVE por padrão
        status: UserStatus.ACTIVE
      };
      
      console.log('Payload enviado para API (createUser):', JSON.stringify(payload, null, 2));
      
      // Garantir que o tenant-id no localStorage seja igual ao do usuário que está sendo criado
      if (localStorage.getItem('tenantId') !== user.tenantId) {
        console.log('Atualizando tenant ID no localStorage:', user.tenantId);
        localStorage.setItem('tenantId', user.tenantId);
        
        // Atualizar a variável global e disparar eventos
        currentTenantId = user.tenantId;
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      }
      
      // Criar configuração com o mesmo tenant-id
      let config = tenantService._createTenantHeader(user.tenantId);
      
      // Log mais detalhado dos cabeçalhos
      console.log('Cabeçalhos enviados para createUser:', JSON.stringify(config, null, 2));
      
      // Verificação adicional para debug
      if (!config.headers || !config.headers['tenant-id']) {
        console.warn('ALERTA: O cabeçalho tenant-id não foi configurado corretamente!');
      }
      
      // Verificação final: garantir que o tenant-id no cabeçalho corresponda ao tenant-id do usuário
      if (!config.headers || config.headers['tenant-id'] !== user.tenantId) {
        console.warn('AVISO: tenant-id no cabeçalho não corresponde ao tenant-id do usuário!');
        console.warn('Atualizando configuração de cabeçalho...');
        config = tenantService._createTenantHeader(user.tenantId);
      }
      
      // Adicionar log detalhado de debug da URL completa
      if (USE_CORS_PROXY) {
        console.log('Usando CORS proxy. URL completa:', 
          'https://cors-proxy.htmldriven.com/?' + encodeURIComponent(API_BASE_URL + '/users'));
      }
      
      const response = await api.post('/users', payload, config);
      console.log('Resposta da API (createUser):', response.data);
      
      // Converter a resposta de snake_case para camelCase
      const convertedResponse: User = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        password: '', // Não retornamos a senha
        tenantId: response.data.tenant_id,
        branchId: response.data.branch_id,
        role: response.data.role as UserRole,
        status: response.data.status as UserStatus
      };
      
      return convertedResponse;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      // Log detalhado da resposta de erro, se disponível
      if (error.response) {
        console.error('Dados da resposta de erro (createUser):', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Verificar especificamente o erro 409 (Conflict) - Usuário já existe
        if (error.response.status === 409 && user.tenantId) {
          const tenantIdFromHeader = localStorage.getItem('tenantId');
          console.warn('Erro 409: Usuário já existe. Verificando o tenant-id usado:');
          console.warn('tenant-id no payload:', user.tenantId);
          console.warn('tenant-id atual no localStorage:', tenantIdFromHeader);
          
          // Se o tenant-id no localStorage for diferente do fornecido no payload, isso pode ser a causa do erro
          if (tenantIdFromHeader !== user.tenantId) {
            console.error('INCOMPATIBILIDADE DETECTADA: tenant-id no localStorage é diferente do tenant-id no payload!');
            
            // Em caso de inconsistência, tente redefinir o tenant-id no localStorage e tentar novamente
            localStorage.setItem('tenantId', user.tenantId);
            currentTenantId = user.tenantId;
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('tenant-id-updated'));
            
            throw new Error(
              'Inconsistência detectada entre tenant-id no localStorage e no payload. ' + 
              'O tenant-id foi atualizado. Por favor, tente novamente.'
            );
          }
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Não houve resposta do servidor:', error.request);
      } else {
        // Erro na configuração da requisição
        console.error('Erro na configuração da requisição:', error.message);
      }
      
      // Se estivermos usando proxy, sugerir tentar sem o proxy
      if (USE_CORS_PROXY) {
        console.info('Considerando os erros, talvez valha a pena tentar sem o proxy CORS. ' +
                     'Defina USE_CORS_PROXY como false e tente novamente.');
      }
      
      throw error;
    }
  },

  // Obter todos os tenants (para admin)
  getAllTenants: async (): Promise<Tenant[]> => {
    try {
      const response = await api.get('/tenants');
      console.log('Resposta da API (getAllTenants):', response.data);
      
      // Converter a resposta de snake_case para camelCase
      const convertedResponse: Tenant[] = response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        document: item.document,
        email: item.email,
        phone: item.phone,
        status: item.status as TenantStatus,
        schema: item.schema,
        planType: item.plan_type as PlanType,
        maxBranches: item.max_branches,
        createdAt: item.created_at ? new Date(item.created_at) : undefined,
        updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
      }));
      
      return convertedResponse;
    } catch (error: any) {
      console.error('Erro ao obter tenants:', error);
      
      // Log detalhado da resposta de erro, se disponível
      if (error.response) {
        console.error('Dados da resposta de erro (getAllTenants):', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },

  // Obter um tenant específico
  getTenantById: async (id: string): Promise<Tenant> => {
    try {
      // Obtenha o ID do tenant atual para o cabeçalho da requisição
      const config = tenantService._createTenantHeader(id);
      
      const response = await api.get(`/tenants/${id}`, config);
      console.log('Resposta da API (getTenantById):', response.data);
      
      // Converter a resposta de snake_case para camelCase
      const convertedResponse: Tenant = {
        id: response.data.id,
        name: response.data.name,
        document: response.data.document,
        email: response.data.email,
        phone: response.data.phone,
        status: response.data.status as TenantStatus,
        schema: response.data.schema,
        planType: response.data.plan_type as PlanType,
        maxBranches: response.data.max_branches,
        createdAt: response.data.created_at ? new Date(response.data.created_at) : undefined,
        updatedAt: response.data.updated_at ? new Date(response.data.updated_at) : undefined
      };
      
      return convertedResponse;
    } catch (error: any) {
      console.error(`Erro ao obter tenant com id ${id}:`, error);
      
      // Log detalhado da resposta de erro, se disponível
      if (error.response) {
        console.error('Dados da resposta de erro (getTenantById):', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },
};

// Tipos para filiais
export enum BranchType {
  MAIN = 'MAIN',
  BRANCH = 'BRANCH',
  WAREHOUSE = 'WAREHOUSE',
  DISTRIBUTION = 'DISTRIBUTION',
  OTHER = 'OTHER'
}

export enum BranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Branch {
  id?: string;
  tenantId?: string;     // ID do Tenant
  name: string;
  code: string;
  type: BranchType;
  document: string;
  address: Address;
  phone: string;
  email: string;
  isMain: boolean;
  status?: BranchStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Serviço de filiais
export const branchService = {
  /**
   * Busca todas as filiais com paginação e filtragem opcional
   */
  getBranches: async (page: number = 0, size: number = 10, filter?: string): Promise<{
    content: Branch[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    // Criar uma chave única para esta requisição específica
    const cacheKey = `branches_page_${page}_size_${size}_filter_${filter || ''}`;
    
    // Usar o deduplicador para evitar chamadas repetidas
    return deduplicateRequest(cacheKey, async () => {
      try {
        let url = `/branches?page=${page + 1}&size=${size}`; // API usa 1-indexed para páginas
        if (filter) {
          url += `&filter=${encodeURIComponent(filter)}`;
        }
        
        // Verificar se temos o tenant ID antes de fazer a requisição
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
          console.error('branchService.getBranches: Tenant ID não encontrado no localStorage!');
          console.error('É necessário configurar o Tenant ID antes de fazer requisições.');
          throw new Error('Tenant ID não configurado. Configure o Tenant ID para continuar.');
        }
        
        console.log(`branchService.getBranches: Buscando filiais com URL: ${url}, tenant-id: ${tenantId}`);
        
        const response = await api.get(url);
        console.log('branchService.getBranches: Resposta original da API:', response.data);
        
        // Adaptar o formato da resposta da API para o formato esperado pelo componente
        const adaptedResponse = {
          content: (response.data.branches || []).map((branch: any) => normalizeBranch(branch)),
          totalElements: response.data.total_count || 0,
          totalPages: response.data.total_pages || 0,
          size: response.data.page_size || size,
          number: (response.data.page ? response.data.page - 1 : page) // Convertendo para 0-indexed
        };
        
        console.log('branchService.getBranches: Resposta adaptada:', adaptedResponse);
        
        return adaptedResponse;
      } catch (error: any) {
        console.error('branchService.getBranches: Erro ao buscar filiais:', error);
        
        // Log detalhado do erro
        if (error.response) {
          console.error('branchService.getBranches: Detalhes do erro:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
          
          // Para erros específicos, dar dicas mais úteis
          if (error.response.status === 400) {
            console.error('branchService.getBranches: Erro 400 (Bad Request). Verifique se:');
            console.error('1. O Tenant ID está configurado corretamente');
            console.error('2. Os parâmetros da requisição estão corretos');
          } else if (error.response.status === 401) {
            console.error('branchService.getBranches: Erro 401 (Unauthorized). Verifique se:');
            console.error('1. O token de autenticação é válido');
            console.error('2. O token não expirou');
          }
        } else if (error.request) {
          console.error('branchService.getBranches: Não houve resposta do servidor:', error.request);
        }
        
        throw error;
      }
    }, 2000); // TTL de 2 segundos para evitar chamadas duplicadas
  },

  /**
   * Busca uma filial específica pelo ID
   */
  getBranchById: async (id: string): Promise<Branch> => {
    try {
      const response = await api.get(`/branches/${id}`);
      console.log('branchService.getBranchById: Filial recuperada com sucesso:', id);
      return response.data;
    } catch (error: any) {
      console.error(`branchService.getBranchById: Erro ao buscar filial ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova filial
   */
  createBranch: async (branch: Branch): Promise<Branch> => {
    try {
      const response = await api.post('/branches', branch);
      console.log('branchService.createBranch: Filial criada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('branchService.createBranch: Erro ao criar filial:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma filial existente
   */
  updateBranch: async (id: string, branch: Branch): Promise<Branch> => {
    try {
      const response = await api.put(`/branches/${id}`, branch);
      console.log(`branchService.updateBranch: Filial ${id} atualizada com sucesso`);
      return response.data;
    } catch (error: any) {
      console.error(`branchService.updateBranch: Erro ao atualizar filial ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta uma filial
   */
  deleteBranch: async (id: string): Promise<void> => {
    try {
      await api.delete(`/branches/${id}`);
      console.log(`branchService.deleteBranch: Filial ${id} excluída com sucesso`);
    } catch (error: any) {
      console.error(`branchService.deleteBranch: Erro ao deletar filial ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera o status de uma filial
   */
  changeBranchStatus: async (id: string, status: BranchStatus): Promise<Branch> => {
    try {
      const response = await api.patch(
        `/branches/${id}/status`,
        { status }
      );
      console.log(`branchService.changeBranchStatus: Status da filial ${id} alterado para ${status}`);
      return response.data;
    } catch (error: any) {
      console.error(`branchService.changeBranchStatus: Erro ao alterar status da filial ${id}:`, error);
      throw error;
    }
  }
};

// Enums para o módulo de clientes
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum PersonType {
  PF = 'PF', // Pessoa Física
  PJ = 'PJ'  // Pessoa Jurídica
}

export enum TaxRegime {
  SIMPLES = 'simples',     // Simples Nacional
  MEI = 'mei',             // Microempreendedor Individual
  PRESUMIDO = 'presumido', // Lucro Presumido
  REAL = 'real'            // Lucro Real
}

export enum CustomerType {
  FINAL = 'final',         // Consumidor Final
  RESELLER = 'reseller',   // Revendedor
  WHOLESALE = 'wholesale'  // Atacadista
}

// Tipos de endereço como string constantes em vez de enum para maior flexibilidade
export const AddressTypes = {
  COMMERCIAL: 'commercial',
  RESIDENTIAL: 'residential',
  DELIVERY: 'delivery',
  BILLING: 'billing',
  OTHER: 'other'
};

// Interfaces para o módulo de clientes
export interface CustomerAddress {
  street: string;          // Logradouro
  number: string;          // Número
  complement?: string;     // Complemento
  district: string;        // Bairro
  city: string;            // Cidade
  state: string;           // Estado
  zipCode: string;         // CEP
  country: string;         // País
  cityCode?: string;       // Código IBGE da Cidade
  stateCode?: string;      // Código IBGE do Estado
  countryCode?: string;    // Código do País
  addressType: string;     // Tipo de Endereço (Entrega, Cobrança, etc)
  mainAddress: boolean;    // Endereço Principal
  deliveryAddress: boolean; // Endereço de Entrega
}

export interface CustomerContact {
  name: string;            // Nome do Contato
  department?: string;     // Departamento
  phone?: string;          // Telefone
  mobilePhone?: string;    // Celular
  email?: string;          // Email
  position?: string;       // Cargo
  mainContact: boolean;    // Contato Principal
}

export interface Customer {
  id?: string;              // ID do Cliente
  tenantId: string;         // ID do Tenant
  branchId: string;         // ID da Filial
  personType: PersonType;   // Tipo de Pessoa (PF/PJ)
  name: string;             // Nome/Razão Social
  tradeName?: string;       // Nome Fantasia
  document: string;         // CPF/CNPJ
  stateDocument?: string;   // Inscrição Estadual
  cityDocument?: string;    // Inscrição Municipal
  taxRegime?: TaxRegime;    // Regime Tributário
  customerType: CustomerType; // Tipo de Cliente
  status: CustomerStatus;   // Status do Cliente
  creditLimit?: number;     // Limite de Crédito
  paymentTerm?: number;     // Prazo de Pagamento (em dias)
  website?: string;         // Website
  observations?: string;    // Observações
  fiscalNotes?: string;     // Observações para Nota Fiscal
  externalCode?: string;    // Código Externo (integração)
  salesmanId?: string;      // ID do Vendedor
  priceTableId?: string;    // ID da Tabela de Preços
  paymentMethodId?: string; // ID da Forma de Pagamento
  suframa?: string;         // Código SUFRAMA
  referenceCode?: string;   // Código de Referência
  lastPurchaseAt?: string;  // Data da Última Compra
  createdAt?: string;       // Data de Criação
  updatedAt?: string;       // Data de Atualização
  addresses: CustomerAddress[]; // Endereços
  contacts: CustomerContact[];  // Contatos
}

// Interface para a resposta paginada de clientes
export interface CustomersResponse {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Função auxiliar para converter objetos de camelCase para snake_case
const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Função auxiliar para converter objetos de volta de snake_case para camelCase
const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Função para transformar campos de um objeto de camelCase para snake_case
const convertToSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertToSnakeCase(item));
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = camelToSnakeCase(key);
    acc[snakeKey] = typeof obj[key] === 'object' ? convertToSnakeCase(obj[key]) : obj[key];
    return acc;
  }, {} as any);
};

// Função para transformar campos de um objeto de snake_case para camelCase
const convertToCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertToCamelCase(item));
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = snakeToCamelCase(key);
    acc[camelKey] = typeof obj[key] === 'object' ? convertToCamelCase(obj[key]) : obj[key];
    return acc;
  }, {} as any);
};

// Funções utilitárias para normalização de objetos

// Normalizar um objeto Branch para o formato esperado pelo componente
const normalizeBranch = (branch: any): Branch => {
  return {
    id: branch.id,
    tenantId: branch.tenant_id || branch.tenantId,
    name: branch.name,
    code: branch.code,
    type: branch.type,
    document: branch.document,
    phone: branch.phone,
    email: branch.email,
    address: {
      street: branch.address?.street,
      number: branch.address?.number,
      complement: branch.address?.complement || '',
      district: branch.address?.district,
      city: branch.address?.city,
      state: branch.address?.state,
      zipCode: branch.address?.zip_code || branch.address?.zipCode,
      country: branch.address?.country
    },
    status: branch.status,
    isMain: branch.is_main !== undefined ? branch.is_main : branch.isMain,
    createdAt: branch.created_at || branch.createdAt,
    updatedAt: branch.updated_at || branch.updatedAt
  };
};

// Normalizar um objeto Customer para o formato esperado pelo componente
const normalizeCustomer = (customer: any): Customer => {
  return {
    id: customer.id,
    tenantId: customer.tenant_id || customer.tenantId,
    branchId: customer.branch_id || customer.branchId,
    personType: customer.person_type || customer.personType,
    name: customer.name,
    tradeName: customer.trade_name || customer.tradeName,
    document: customer.document,
    stateDocument: customer.state_document || customer.stateDocument,
    cityDocument: customer.city_document || customer.cityDocument,
    taxRegime: customer.tax_regime || customer.taxRegime,
    customerType: customer.customer_type || customer.customerType,
    status: customer.status,
    creditLimit: customer.credit_limit || customer.creditLimit || 0,
    paymentTerm: customer.payment_term || customer.paymentTerm || 0,
    website: customer.website,
    observations: customer.observations,
    fiscalNotes: customer.fiscal_notes || customer.fiscalNotes,
    externalCode: customer.external_code || customer.externalCode,
    salesmanId: customer.salesman_id || customer.salesmanId,
    priceTableId: customer.price_table_id || customer.priceTableId,
    paymentMethodId: customer.payment_method_id || customer.paymentMethodId,
    suframa: customer.suframa,
    referenceCode: customer.reference_code || customer.referenceCode,
    lastPurchaseAt: customer.last_purchase_at || customer.lastPurchaseAt,
    createdAt: customer.created_at || customer.createdAt,
    updatedAt: customer.updated_at || customer.updatedAt,
    // Normalizar arrays de endereços e contatos
    addresses: (customer.addresses || []).map((addr: any) => ({
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      district: addr.district,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip_code || addr.zipCode,
      country: addr.country,
      cityCode: addr.city_code || addr.cityCode,
      stateCode: addr.state_code || addr.stateCode,
      countryCode: addr.country_code || addr.countryCode,
      addressType: addr.address_type || addr.addressType,
      mainAddress: addr.main_address !== undefined ? addr.main_address : addr.mainAddress,
      deliveryAddress: addr.delivery_address !== undefined ? addr.delivery_address : addr.deliveryAddress
    })),
    contacts: (customer.contacts || []).map((contact: any) => ({
      name: contact.name,
      department: contact.department || '',
      phone: contact.phone || '',
      mobilePhone: contact.mobile_phone || contact.mobilePhone || '',
      email: contact.email || '',
      position: contact.position || '',
      mainContact: contact.main_contact !== undefined ? contact.main_contact : contact.mainContact
    }))
  };
};

// Serviço de clientes
export const customerService = {
  /**
   * Busca todos os clientes com paginação e filtragem opcional
   */
  getCustomers: async (page: number = 0, size: number = 10, filter?: string): Promise<CustomersResponse> => {
    // Criar uma chave única para esta requisição específica
    const cacheKey = `customers_page_${page}_size_${size}_filter_${filter || ''}`;
    
    // Usar o deduplicador para evitar chamadas repetidas
    return deduplicateRequest(cacheKey, async () => {
      try {
        // Garantir que estamos acessando o endpoint correto de customers, não branches
        let url = `/customers?page=${page + 1}&size=${size}`; // API usa 1-indexed para páginas
        
        // Verificar se a API realmente está usando customers ou outro caminho
        const apiBasePath = '/customers'; // Se precisar mudar, atualize aqui
        url = `${apiBasePath}?page=${page + 1}&size=${size}`;
        
        if (filter) {
          url += `&name=${encodeURIComponent(filter)}`;
        }
        
        console.log(`customerService.getCustomers: URL final: ${url}`);
        
        // Verificar se temos o tenant ID antes de fazer a requisição
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
          console.error('customerService.getCustomers: Tenant ID não encontrado no localStorage!');
          console.error('É necessário configurar o Tenant ID antes de fazer requisições.');
          throw new Error('Tenant ID não configurado. Configure o Tenant ID para continuar.');
        }
        
        console.log(`customerService.getCustomers: Buscando clientes com URL: ${url}, tenant-id: ${tenantId}`);
        
        const response = await api.get(url);
        console.log('customerService.getCustomers: Resposta original da API:', response.data);
        
        // Criar uma resposta padrão com o formato esperado pelo frontend
        const adaptedResponse: CustomersResponse = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page
        };
        
        // Novo formato da API: {items, total, page, size, total_pages}
        if (response.data.items && Array.isArray(response.data.items)) {
          adaptedResponse.content = response.data.items.map((customer: any) => normalizeCustomer(customer));
          adaptedResponse.totalElements = response.data.total || 0;
          adaptedResponse.totalPages = response.data.total_pages || 0;
          adaptedResponse.size = response.data.size || size;
          adaptedResponse.number = (response.data.page ? response.data.page - 1 : page); // Convertendo para 0-indexed
          return adaptedResponse;
        }
        
        // Formato antigo: {customers, total_count, etc.}
        if (response.data.customers && Array.isArray(response.data.customers)) {
          adaptedResponse.content = response.data.customers.map((customer: any) => normalizeCustomer(customer));
          adaptedResponse.totalElements = response.data.total_count || 0;
          adaptedResponse.totalPages = response.data.total_pages || 0;
          adaptedResponse.size = response.data.page_size || size;
          adaptedResponse.number = (response.data.page ? response.data.page - 1 : page); // Convertendo para 0-indexed
          return adaptedResponse;
        }
        
        // Formato esperado pelo componente: {content, totalElements, etc.}
        if (response.data.content && Array.isArray(response.data.content)) {
          adaptedResponse.content = response.data.content.map((customer: any) => normalizeCustomer(customer));
          adaptedResponse.totalElements = response.data.totalElements || 0;
          adaptedResponse.totalPages = response.data.totalPages || 0;
          adaptedResponse.size = response.data.size || size;
          adaptedResponse.number = response.data.number || page;
          return adaptedResponse;
        }
        
        // Se chegou aqui, tentar extrair o array de clientes da resposta
        console.warn('customerService.getCustomers: Formato de resposta desconhecido, tentando adaptar...');
        let customersArray: any[] = [];
        
        if (Array.isArray(response.data)) {
          customersArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Procurar uma propriedade que seja um array
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              customersArray = response.data[key];
              break;
            }
          }
        }
        
        if (customersArray.length > 0) {
          adaptedResponse.content = customersArray.map(customer => normalizeCustomer(customer));
          adaptedResponse.totalElements = customersArray.length;
          adaptedResponse.totalPages = 1;
        }
        
        return adaptedResponse;
      } catch (error: any) {
        console.error('customerService.getCustomers: Erro ao buscar clientes:', error);
        
        // Log detalhado do erro
        if (error.response) {
          console.error('customerService.getCustomers: Detalhes do erro:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
          
          // Para erros específicos, dar dicas mais úteis
          if (error.response.status === 400) {
            console.error('customerService.getCustomers: Erro 400 (Bad Request). Verifique se:');
            console.error('1. O Tenant ID está configurado corretamente');
            console.error('2. Os parâmetros da requisição estão corretos');
            console.error('3. O servidor está esperando os campos em snake_case (tente reinstalar a aplicação)');
          } else if (error.response.status === 401) {
            console.error('customerService.getCustomers: Erro 401 (Unauthorized). Verifique se:');
            console.error('1. O token de autenticação é válido');
            console.error('2. O token não expirou');
            console.error('3. Você tem permissão para acessar este recurso');
          } else if (error.response.status === 403) {
            console.error('customerService.getCustomers: Erro 403 (Forbidden). Verifique se:');
            console.error('1. O Tenant ID está correto');
            console.error('2. Você tem permissão para acessar este recurso');
          } else if (error.response.status === 404) {
            console.error('customerService.getCustomers: Erro 404 (Not Found). Verifique se:');
            console.error('1. A URL da API está correta');
            console.error('2. O endpoint /customers existe no backend');
          } else if (error.response.status === 500) {
            console.error('customerService.getCustomers: Erro 500 (Internal Server Error). Isso é um problema no servidor.');
            console.error('Verifique os logs do servidor para mais detalhes.');
          }
        } else if (error.request) {
          console.error('customerService.getCustomers: Não houve resposta do servidor:', error.request);
          console.error('Verifique se:');
          console.error('1. O servidor está em execução');
          console.error('2. A URL da API está correta');
          console.error('3. Não há problemas de rede ou firewall');
        } else {
          console.error('customerService.getCustomers: Erro na configuração da requisição:', error.message);
        }
        
        throw error;
      }
    }, 2000); // TTL de 2 segundos para evitar chamadas duplicadas
  },

  /**
   * Busca um cliente específico pelo ID
   */
  getCustomerById: async (id: string): Promise<Customer> => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca um cliente pelo documento (CPF/CNPJ)
   */
  getCustomerByDocument: async (document: string): Promise<Customer> => {
    try {
      const response = await api.get(`/customers/document/${document}`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar cliente pelo documento ${document}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo cliente
   */
  createCustomer: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    try {
      const response = await api.post('/customers', customer);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  /**
   * Atualiza um cliente existente
   */
  updateCustomer: async (id: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    try {
      const response = await api.put(`/customers/${id}`, customer);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao atualizar cliente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta um cliente
   */
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error: any) {
      console.error(`Erro ao deletar cliente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera o status de um cliente
   */
  changeCustomerStatus: async (id: string, status: CustomerStatus): Promise<Customer> => {
    try {
      const response = await api.patch(
        `/customers/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao alterar status do cliente ${id}:`, error);
      throw error;
    }
  }
};

export default api; 