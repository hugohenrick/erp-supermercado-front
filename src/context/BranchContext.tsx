import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Branch, branchService } from '../services/api';

interface BranchContextType {
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  branches: Branch[];
  loading: boolean;
  error: string | null;
  refreshBranches: () => Promise<Branch[]>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Recuperar a filial ativa do localStorage durante a inicialização
  useEffect(() => {
    const loadActiveBranch = () => {
      const storedBranchJson = localStorage.getItem('activeBranch');
      if (storedBranchJson) {
        try {
          const storedBranch = JSON.parse(storedBranchJson);
          setActiveBranchState(storedBranch);
          
          // Armazenar o branchId separadamente para fácil acesso
          localStorage.setItem('branchId', storedBranch.id);
          
          // Disparar evento para notificar a aplicação da mudança
          window.dispatchEvent(new CustomEvent('branch-id-updated'));
        } catch (e) {
          console.error('Erro ao carregar filial ativa do localStorage:', e);
          localStorage.removeItem('activeBranch');
          localStorage.removeItem('branchId');
        }
      }
    };

    loadActiveBranch();
  }, []);

  // Função para definir a filial ativa
  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem('activeBranch', JSON.stringify(branch));
    localStorage.setItem('branchId', branch.id || '');
    
    // Disparar evento para notificar a aplicação da mudança
    window.dispatchEvent(new CustomEvent('branch-id-updated'));
    
    console.log('Filial ativa definida:', branch.name, branch.id);
  };

  // Função para buscar todas as filiais - agora usando useCallback para estabilizar a referência
  const refreshBranches = useCallback(async (force: boolean = false) => {
    // Verificação de cache - só buscar novamente se passou pelo menos 2 minutos desde a última vez
    // ou se a busca for forçada (force = true)
    const now = Date.now();
    const cacheDuration = 2 * 60 * 1000; // 2 minutos em milissegundos
    
    if (!force && branches.length > 0 && (now - lastFetchTime < cacheDuration)) {
      console.log('Usando cache de filiais - última busca há', Math.round((now - lastFetchTime)/1000), 'segundos');
      return branches;
    }
    
    // Se já estiver carregando, não iniciar outra busca
    if (loading) {
      console.log('Já está buscando filiais, aguardando...');
      return branches;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Buscando todas as filiais do servidor...');
      // Buscar todas as filiais (usando tamanho grande para pegar todas)
      const result = await branchService.getBranches(0, 100);
      setBranches(result.content);
      setLastFetchTime(Date.now());
      
      // Se não houver filial ativa e temos filiais, selecionar a primeira
      if (!activeBranch && result.content.length > 0) {
        // Preferir a filial principal, se existir
        const mainBranch = result.content.find(branch => branch.isMain);
        setActiveBranch(mainBranch || result.content[0]);
      }
      
      return result.content;
    } catch (err: any) {
      console.error('Erro ao buscar filiais:', err);
      setError(err.message || 'Erro ao buscar filiais');
      return branches; // Retornar as filiais atuais em caso de erro
    } finally {
      setLoading(false);
    }
  }, [branches, loading, activeBranch, lastFetchTime]);

  // Carregar as filiais ao iniciar - somente uma vez
  useEffect(() => {
    // Só carregar as filiais se tivermos um tenant configurado
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId && branches.length === 0) {
      console.log('Carregando filiais inicialmente...');
      refreshBranches(true);
    }
  }, [refreshBranches]); // Executará apenas uma vez na inicialização

  const value = {
    activeBranch,
    setActiveBranch,
    branches,
    loading,
    error,
    refreshBranches: () => refreshBranches(false) // Wrap para facilitar o uso
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

// Hook personalizado para usar o contexto de filial
export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext);
  
  if (context === undefined) {
    throw new Error('useBranch deve ser usado dentro de um BranchProvider');
  }
  
  return context;
}; 