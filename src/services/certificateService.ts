import api, { deduplicateRequest } from './api';

export interface Certificate {
  id: string;
  name: string;
  branch_id: string;
  branch_name: string;
  expiration_date: string;
  password?: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateInfo {
  expiration_date: string;
  subject: string;
}

export interface CertificateListResponse {
  certificates: Certificate[];
  total: number;
}

export interface CertificateRequest {
  name: string;
  branch_id: string;
  password: string;
  expiration_date: string;
  is_active?: boolean;
  file?: File;
}

export const certificateService = {
  async getCertificates(page: number, per_page: number): Promise<CertificateListResponse> {
    // Criar uma chave única para esta requisição específica
    const cacheKey = `certificates_page_${page}_per_page_${per_page}`;
    
    // Usar o deduplicador para evitar chamadas repetidas
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<CertificateListResponse>('/certificates', {
        params: { page, per_page }
      });
      return response.data;
    }, 2000); // TTL de 2 segundos para evitar chamadas duplicadas
  },

  async getCertificateById(id: string): Promise<Certificate> {
    const response = await api.get<Certificate>(`/certificates/${id}`);
    return response.data;
  },

  async createCertificate(data: CertificateRequest): Promise<Certificate> {
    return new Promise((resolve, reject) => {
      try {
        // Converter a data do formato ISO para AAAAMMDDHHMMSS
        const isoDate = data.expiration_date;
        const formattedDate = isoDate
          .replace(/[T:-]/g, '') // Remove T, : e -
          .concat('00'); // Adiciona segundos
        
        console.log('Data original (ISO):', isoDate);
        console.log('Data formatada (AAAAMMDDHHMMSS):', formattedDate);
        
        // Verificar o arquivo
        if (!(data.file instanceof File)) {
          console.error('Arquivo não é uma instância de File:', data.file);
          reject(new Error('Arquivo inválido'));
          return;
        }
        
        // Obter credenciais
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const branchId = localStorage.getItem('branchId');
        
        if (!token || !tenantId || !branchId) {
          reject(new Error('Faltam credenciais para a requisição'));
          return;
        }
        
        // Log detalhado
        console.log('===== DADOS PARA ENVIO =====');
        console.log('Nome do arquivo:', data.file.name);
        console.log('Tipo do arquivo:', data.file.type);
        console.log('Tamanho do arquivo:', data.file.size, 'bytes');
        console.log('Nome do certificado:', data.name.trim());
        console.log('ID da filial:', data.branch_id.trim());
        console.log('Password: [PRESENTE]');
        console.log('Data de expiração (formatada):', formattedDate);
        console.log('Ativo:', data.is_active === true ? 'true' : 'false');
        console.log('Tenant ID:', tenantId);
        
        // SOLUÇÃO FINAL: TENTATIVA COM XMLHttpRequest E FORMDATA, CORRIGINDO O TENANT ID
        
        // 1. Criar o FormData
        const formData = new FormData();
        
        // 2. Adicionar campos de dados
        formData.append('name', data.name.trim() || '');
        formData.append('branch_id', data.branch_id.trim() || '');
        formData.append('password', data.password.trim() || '');
        formData.append('expiration_date', formattedDate);
        formData.append('is_active', data.is_active === true ? 'true' : 'false');
        
        // ADICIONAR TAMBÉM TENANT_ID NO FORMDATA
        formData.append('tenant_id', tenantId);
        
        // 3. Adicionar o arquivo por último
        formData.append('certificate', data.file as File);
        
        // 4. Configurar o XMLHttpRequest
        const xhr = new XMLHttpRequest();
        
        // 5. Configurar endpoint
        const apiBaseUrl = api.defaults.baseURL || '';
        const url = `${apiBaseUrl}/certificates`;
        console.log('Enviando requisição para:', url);
        
        xhr.open('POST', url);
        
        // 6. Adicionar os headers HTTP
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Tenant-Id', tenantId);
        xhr.setRequestHeader('Branch-Id', branchId);
        
        // NOME ALTERNATIVO PARA O TENANT ID (ALGUMAS APIS USAM DIFERENTES CONVENÇÕES)
        xhr.setRequestHeader('TenantId', tenantId);
        xhr.setRequestHeader('tenant_id', tenantId);
        xhr.setRequestHeader('X-Tenant-Id', tenantId);
        
        // 7. Configurar handlers de eventos
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) { // Complete
            console.log('Resposta completa recebida. Status:', xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              // Sucesso
              try {
                const response = JSON.parse(xhr.responseText);
                console.log('Certificado criado com sucesso:', response);
                resolve(response);
              } catch (error) {
                console.error('Erro ao processar resposta:', error);
                reject(new Error('Resposta inválida do servidor'));
              }
            } else {
              // Erro
              try {
                console.log('Resposta de erro:', xhr.responseText);
                const errorResponse = JSON.parse(xhr.responseText);
                console.error('Erro do servidor:', errorResponse);
                reject(new Error(errorResponse.message || `Erro ${xhr.status}: ${xhr.statusText}`));
              } catch (error) {
                console.error('Erro ao processar resposta de erro:', error);
                reject(new Error(`Erro ${xhr.status}: ${xhr.statusText}`));
              }
            }
          }
        };
        
        // 8. Monitorar progresso
        xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`Upload: ${percentComplete}% completo`);
          }
        };
        
        // 9. Configurar erros
        xhr.onerror = function() {
          console.error('Erro de rede na requisição');
          reject(new Error('Erro de rede ao enviar certificado'));
        };
        
        // 10. Enviar a requisição
        console.log('Enviando requisição...');
        xhr.send(formData);
        console.log('Requisição enviada, aguardando resposta...');
        
      } catch (error) {
        console.error('Erro ao criar certificado:', error);
        reject(error);
      }
    });
  },

  async updateCertificate(id: string, data: Omit<CertificateRequest, 'file'>): Promise<Certificate> {
    const response = await api.put<Certificate>(`/certificates/${id}`, data);
    return response.data;
  },

  async uploadCertificate(id: string, file: File): Promise<Certificate> {
    const formData = new FormData();
    formData.append('certificate', file);

    const response = await api.post<Certificate>(`/certificates/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteCertificate(id: string): Promise<void> {
    await api.delete(`/certificates/${id}`);
  },

  async activateCertificate(id: string): Promise<Certificate> {
    const response = await api.post<Certificate>(`/certificates/${id}/activate`);
    return response.data;
  },

  async deactivateCertificate(id: string): Promise<Certificate> {
    const response = await api.post<Certificate>(`/certificates/${id}/deactivate`);
    return response.data;
  },

  async getExpiringCertificates(): Promise<Certificate[]> {
    const response = await api.get<Certificate[]>('/certificates/expiring');
    return response.data;
  },

  async extractCertificateInfo(formData: FormData): Promise<CertificateInfo> {
    try {
      // Verificar se o arquivo e a senha foram fornecidos
      const file = formData.get('certificate');
      const password = formData.get('password');

      if (!file) {
        throw new Error('Arquivo do certificado não fornecido');
      }

      if (!password) {
        throw new Error('Senha do certificado não fornecida');
      }

      // Log para debug
      if (file instanceof File) {
        console.log('Enviando arquivo para API:', file.name, file.type, file.size);
      }
      console.log('Senha fornecida:', password);

      // Usar o FormData original ao invés de criar um novo
      const response = await api.post<{expirationDate: string; subject: string}>(
        '/certificates/extract-info',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Converter a resposta de volta para o formato esperado
      return {
        expiration_date: response.data.expirationDate,
        subject: response.data.subject
      };
    } catch (error: any) {
      console.error('Erro completo ao extrair informações do certificado:', error);
      
      if (error.response) {
        console.error('Resposta da API:', error.response.data);
        throw new Error(error.response.data.message || 'Erro ao extrair informações do certificado');
      }
      
      throw error;
    }
  }
};

export default certificateService; 