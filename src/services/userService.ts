import api from './api';
import { User, UserStatus } from './api';

interface ApiResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserRequest {
  name: string;
  email: string;
  password?: string;
  role: string;
  branchId?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export const userService = {
  // Listar usuários com paginação
  getUsers: async (page: number = 0, size: number = 10, search?: string): Promise<UsersResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (search) {
        params.append('search', search);
      }
      
      const response = await api.get<ApiResponse<User>>(`/users?${params.toString()}`);
      
      // Convert API response to expected format
      return {
        users: response.data.data || [],
        total: response.data.total_count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },
  
  // Criar novo usuário
  createUser: async (userData: UserRequest): Promise<User> => {
    try {
      const response = await api.post<User>('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },
  
  // Listar usuários por filial
  getUsersByBranch: async (branchId: string, page: number = 0, size: number = 10): Promise<UsersResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      const response = await api.get<UsersResponse>(`/users/branch/${branchId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários da filial:', error);
      throw error;
    }
  },
  
  // Buscar usuário por ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },
  
  // Atualizar usuário
  updateUser: async (id: string, userData: UserRequest): Promise<User> => {
    try {
      const response = await api.put<User>(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },
  
  // Remover usuário
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      throw error;
    }
  },
  
  // Alterar senha do usuário
  changePassword: async (id: string, newPassword: string): Promise<void> => {
    try {
      await api.patch(`/users/${id}/password`, { password: newPassword });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  },
  
  // Atualizar status do usuário
  updateStatus: async (id: string, status: UserStatus): Promise<User> => {
    try {
      const response = await api.patch<User>(`/users/${id}/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      throw error;
    }
  }
};

export default userService; 