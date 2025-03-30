import api from './api';

export interface MCPMessageRequest {
  message: string;
}

export interface MCPMessageResponse {
  response: string;
}

export interface MCPHistoryMessage {
  id: string;
  content: string;
  role: string;
  timestamp: string;
  user_id: string;
}

interface MCPHistoryResponse {
  history: MCPHistoryMessage[] | null;
}

export const mcpService = {
  sendMessage: async (message: string): Promise<MCPMessageResponse> => {
    try {
      const response = await api.post<MCPMessageResponse>('/mcp/message', {
        message
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para MCP:', error);
      throw error;
    }
  },

  getHistory: async (): Promise<MCPHistoryMessage[]> => {
    try {
      const response = await api.get<MCPHistoryResponse>('/mcp/history');
      return response.data.history || [];
    } catch (error) {
      console.error('Erro ao buscar histórico do chat:', error);
      throw error;
    }
  }
};

export default mcpService; 