import axios from 'axios';

// Definir se deve usar um proxy CORS ou não
const USE_CORS_PROXY = false; // Alternar para false quando o backend tiver CORS configurado

// URL base da API
const API_BASE_URL = 'http://localhost:8084/api/v1';

// Cria uma instância do axios com configurações base
const api = axios.create({
  // Usar URL direta para o backend ou com proxy, dependendo da configuração
  baseURL: USE_CORS_PROXY 
    ? 'https://cors-proxy.htmldriven.com/?' + encodeURIComponent(API_BASE_URL)
    : API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Para o proxy CORS adicionar cabeçalho necessário
    ...(USE_CORS_PROXY ? { 'x-requested-with': 'XMLHttpRequest' } : {})
  },
  // Não usar withCredentials para evitar problemas com CORS preflight
  // withCredentials: true
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
  if (USE_CORS_PROXY) {
    // Se estamos usando o proxy, precisamos ajustar como os headers são enviados
    // Este proxy específico requer que headers adicionais específicos sejam passados de uma maneira especial
    
    // Salvar headers originais
    const originalHeaders = { ...config.headers };
    
    // Remove headers customizados da configuração normal
    if (originalHeaders['tenant-id']) {
      delete config.headers['tenant-id'];
    }
    
    // Adiciona os headers customizados em um formato que o proxy entenda
    config.headers['X-Proxy-Headers'] = JSON.stringify({
      'tenant-id': originalHeaders['tenant-id']
    });
    
    // Se for uma requisição POST/PUT com dados
    if (config.data && (config.method === 'post' || config.method === 'put')) {
      // Alguns proxies podem precisar que os dados sejam enviados de maneira especial
      // Dependendo do proxy usado, pode ser necessário ajustar esta lógica
    }
  }
  
  return config;
};

// Variável global para armazenar o tenant-id atual
let currentTenantId: string | null = localStorage.getItem('tenantId');

// Listener para atualizar o tenant-id quando ele mudar no localStorage
window.addEventListener('storage', () => {
  const newTenantId = localStorage.getItem('tenantId');
  console.log('Evento storage: Tenant ID atualizado:', newTenantId);
  currentTenantId = newTenantId;
});

// Também ouvir um evento personalizado para atualizações manuais
window.addEventListener('tenant-id-updated', () => {
  const newTenantId = localStorage.getItem('tenantId');
  console.log('Evento tenant-id-updated: Tenant ID atualizado:', newTenantId);
  currentTenantId = newTenantId;
});

// Interceptor para adicionar token de autenticação e lidar com o proxy
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Usar o tenant-id da variável global, que é atualizada pelos listeners
    const tenantId = currentTenantId || localStorage.getItem('tenantId');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      config.headers['tenant-id'] = tenantId;
      console.log(`Interceptor: Adicionando tenant-id (${tenantId}) ao cabeçalho da requisição para ${config.url}`);
    } else {
      console.warn(`Interceptor: tenant-id NÃO ENCONTRADO no localStorage para requisição ${config.url}`);
      console.warn('As requisições que exigem tenant-id podem falhar. Configure o tenant-id na tela de listagem de clientes.');
    }
    
    // Converter dados para snake_case antes de enviar ao servidor
    if (config.data && (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
      console.log('Convertendo dados de requisição para snake_case');
      config.data = convertToSnakeCase(config.data);
      console.log('Dados convertidos:', config.data);
    }
    
    // Aplicar modificações necessárias para o proxy
    return handleProxiedRequest(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adicionar interceptor de resposta para converter de snake_case para camelCase
api.interceptors.response.use(
  (response) => {
    // Converter dados da resposta para camelCase
    if (response.data) {
      console.log('Convertendo dados de resposta para camelCase');
      response.data = convertToCamelCase(response.data);
      console.log('Dados convertidos:', response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interface para o status do Tenant
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

// Para o usuário, vamos adicionar enum para Role
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CASHIER = 'CASHIER',
}

// Interface para o tipo de plano
export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

// Interface para o Tenant (Empresa)
export interface Tenant {
  id?: string;
  name: string;
  document: string; // CNPJ da empresa
  email: string;
  phone: string;
  status?: TenantStatus;
  schema?: string; // Nome do schema no banco de dados
  planType: PlanType;
  maxBranches: number; // Número máximo de filiais permitidas
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para criar um usuário associado ao tenant
export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  tenantId?: string;
  branchId?: string;
  role?: UserRole;
  status?: TenantStatus;
  isAdmin?: boolean; // Campo auxiliar para UI
}

// Interface para resposta de autenticação
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenant_id?: string; // O backend agora retorna tenant_id na resposta
}

// Interface para credenciais de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Serviço de autenticação
export const authService = {
  // Login simplificado - sem necessidade de tenant_id
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Tentando login com:', { email: credentials.email, password: '••••••••' });
    
    try {
      // Fazer a requisição diretamente sem interceptors para evitar conversões
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('Resposta de login (dados originais):', response.data);
      
      // Armazenar informações no localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      
      // Armazenar o tenant_id que está dentro do objeto user (usando snake_case diretamente)
      if (response.data.user && response.data.user.tenant_id) {
        const tenantId = response.data.user.tenant_id;
        console.log('Login: Tenant ID encontrado no user (snake_case):', tenantId);
        localStorage.setItem('tenantId', tenantId);
        
        // Atualizar a variável global e disparar eventos
        currentTenantId = tenantId;
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      } else {
        console.warn('Login: Nenhum tenant_id encontrado na resposta de login!');
        console.warn('Response data:', response.data);
      }
      
      // Converter para o formato esperado pela aplicação
      const authResponse: AuthResponse = {
        user: {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          tenantId: response.data.user.tenant_id,
          role: response.data.user.role,
          status: response.data.user.status
        },
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tenant_id: response.data.user.tenant_id
      };
      
      return authResponse;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },
  
  // Obter dados do usuário atual
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  },
  
  // Renovar o token JWT
  refreshToken: async (): Promise<{ token: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token não disponível');
    }
    
    try {
      const response = await api.post<any>('/auth/refresh-token', {
        refresh_token: refreshToken
      });
      
      // Atualizar o token no localStorage
      localStorage.setItem('token', response.data.access_token);
      
      // Se a resposta incluir um tenant_id atualizado, armazená-lo também
      if (response.data.user && response.data.user.tenant_id) {
        localStorage.setItem('tenantId', response.data.user.tenant_id);
      }
      
      return { token: response.data.access_token };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Em caso de erro, fazer logout
      authService.logout();
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
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
        status: TenantStatus.ACTIVE, // Definir status como ACTIVE por padrão
        // Este endpoint específico não precisa de informações como branch_id, etc.
      };
      
      console.log('Payload enviado para API (createAdminUser):', JSON.stringify(payload, null, 2));
      
      // Usar a função auxiliar para criar o cabeçalho com tenant-id
      // Importante: Este endpoint pode não precisar do tenant-id no cabeçalho, 
      // já que é passado no payload, mas vamos incluir por precaução
      const config = tenantService._createTenantHeader(user.tenantId);
      
      // Log mais detalhado dos cabeçalhos
      console.log('Cabeçalhos enviados para createAdminUser:', JSON.stringify(config, null, 2));
      
      // Adicionar log detalhado de debug da URL completa
      if (USE_CORS_PROXY) {
        console.log('Usando CORS proxy. URL completa:', 
          'https://cors-proxy.htmldriven.com/?' + encodeURIComponent(API_BASE_URL + '/setup/admin'));
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
        status: TenantStatus.ACTIVE
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
        status: TenantStatus.ACTIVE
      };
      
      console.log('Payload enviado para API (createUser):', JSON.stringify(payload, null, 2));
      
      // Usar a função auxiliar para criar o cabeçalho com tenant-id
      const config = tenantService._createTenantHeader(user.tenantId);
      
      // Log mais detalhado dos cabeçalhos
      console.log('Cabeçalhos enviados para createUser:', JSON.stringify(config, null, 2));
      
      // Verificação adicional para debug
      if (!config.headers || !config.headers['tenant-id']) {
        console.warn('ALERTA: O cabeçalho tenant-id não foi configurado corretamente!');
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
        status: response.data.status as TenantStatus
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
    try {
      let url = `/customers?page=${page + 1}&size=${size}`; // API usa 1-indexed para páginas
      if (filter) {
        url += `&name=${encodeURIComponent(filter)}`;
      }
      
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
      
      // Verificar se a resposta está no formato esperado
      // Se a API retornar {customers, total_count, etc.} em vez de {content, totalElements, etc.}
      if (response.data.customers && !response.data.content) {
        // Adaptar o formato da resposta da API para o formato esperado pelo componente
        return {
          content: (response.data.customers || []).map((customer: any) => normalizeCustomer(customer)),
          totalElements: response.data.total_count || 0,
          totalPages: response.data.total_pages || 0,
          size: response.data.page_size || size,
          number: (response.data.page ? response.data.page - 1 : page) // Convertendo para 0-indexed
        };
      }
      
      // Verificar se a resposta já está no formato esperado mas precisa normalizar os objetos
      if (response.data.content && Array.isArray(response.data.content)) {
        return {
          ...response.data,
          content: response.data.content.map((customer: any) => normalizeCustomer(customer))
        };
      }
      
      // Se chegou aqui, retornar dados como estão
      return response.data;
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