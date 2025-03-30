import api from './api';
import { Branch, BranchType, BranchStatus } from './api';

export interface BranchListResponse {
  content: Branch[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BranchRequest {
  name: string;
  code: string;
  type: BranchType;
  document: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  isMain: boolean;
}

// Função auxiliar para normalizar os dados da filial
const normalizeBranch = (branch: any): Branch => ({
  id: branch.id,
  tenantId: branch.tenant_id,
  name: branch.name,
  code: branch.code,
  type: branch.type as BranchType,
  document: branch.document,
  address: {
    street: branch.address?.street || '',
    number: branch.address?.number || '',
    complement: branch.address?.complement,
    district: branch.address?.district || '',
    city: branch.address?.city || '',
    state: branch.address?.state || '',
    zipCode: branch.address?.zip_code || '',
    country: branch.address?.country || ''
  },
  phone: branch.phone,
  email: branch.email,
  isMain: branch.is_main || false,
  status: branch.status as BranchStatus,
  createdAt: branch.created_at,
  updatedAt: branch.updated_at
});

export const branchService = {
  async getBranches(page: number = 0, size: number = 10): Promise<BranchListResponse> {
    try {
      const response = await api.get('/branches', {
        params: { page: page + 1, size } // API usa 1-indexed para páginas
      });

      // Adaptar o formato da resposta da API para o formato esperado
      const adaptedResponse: BranchListResponse = {
        content: (response.data.branches || []).map(normalizeBranch),
        totalElements: response.data.total_count || 0,
        totalPages: response.data.total_pages || 0,
        size: response.data.page_size || size,
        number: (response.data.page ? response.data.page - 1 : page) // Convertendo para 0-indexed
      };

      return adaptedResponse;
    } catch (error) {
      console.error('Erro ao buscar filiais:', error);
      throw error;
    }
  },

  async getBranchById(id: string): Promise<Branch> {
    try {
      const response = await api.get(`/branches/${id}`);
      return normalizeBranch(response.data);
    } catch (error) {
      console.error('Erro ao buscar filial:', error);
      throw error;
    }
  },

  async createBranch(data: BranchRequest): Promise<Branch> {
    try {
      const response = await api.post('/branches', data);
      return normalizeBranch(response.data);
    } catch (error) {
      console.error('Erro ao criar filial:', error);
      throw error;
    }
  },

  async updateBranch(id: string, data: Partial<BranchRequest>): Promise<Branch> {
    try {
      const response = await api.put(`/branches/${id}`, data);
      return normalizeBranch(response.data);
    } catch (error) {
      console.error('Erro ao atualizar filial:', error);
      throw error;
    }
  },

  async deleteBranch(id: string): Promise<void> {
    try {
      await api.delete(`/branches/${id}`);
    } catch (error) {
      console.error('Erro ao excluir filial:', error);
      throw error;
    }
  },

  async activateBranch(id: string): Promise<Branch> {
    try {
      const response = await api.post(`/branches/${id}/activate`);
      return normalizeBranch(response.data);
    } catch (error) {
      console.error('Erro ao ativar filial:', error);
      throw error;
    }
  },

  async deactivateBranch(id: string): Promise<Branch> {
    try {
      const response = await api.post(`/branches/${id}/deactivate`);
      return normalizeBranch(response.data);
    } catch (error) {
      console.error('Erro ao desativar filial:', error);
      throw error;
    }
  }
};

export default branchService; 