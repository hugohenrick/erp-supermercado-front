import { useEffect, useState, useCallback, useRef } from 'react';
import { useBranch } from '../context/BranchContext';

/**
 * Custom hook to handle data refreshing when the active branch changes.
 * 
 * @param refreshFunction The function to call when the branch changes
 * @param dependencies Additional dependencies for the refresh function
 * @param setPage Optional function to reset page to 0 when branch changes
 * @returns An object containing loading state and a manual refresh function
 * 
 * @example
 * // In any list component:
 * const fetchData = useCallback(async () => {
 *   // Your data fetching logic here
 * }, [page, pageSize]);
 * 
 * const { loading, refresh } = useBranchChangeRefresh(fetchData, [page, pageSize], setPage);
 */
export function useBranchChangeRefresh<T extends any[]>(
  refreshFunction: () => Promise<void> | void,
  dependencies: T = [] as unknown as T,
  setPage?: (page: number) => void
) {
  const { activeBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const isRefreshingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Wrap the refresh function to handle loading state and prevent duplicate calls
  const refresh = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isRefreshingRef.current) {
      console.log('Refresh já em andamento, ignorando chamada duplicada');
      return;
    }
    
    isRefreshingRef.current = true;
    setLoading(true);
    
    try {
      await refreshFunction();
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [refreshFunction]);

  // Função de debounce para prevenir múltiplas chamadas em intervalos curtos
  const debouncedRefresh = useCallback(() => {
    // Limpar qualquer timeout existente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Resetar para a primeira página se solicitado
    if (setPage) {
      setPage(0);
    }
    
    // Adicionar delay antes de executar a operação
    timeoutRef.current = setTimeout(() => {
      refresh();
    }, 300);
  }, [refresh, setPage]);

  // Observar mudanças no activeBranch
  useEffect(() => {
    if (activeBranch) {
      console.log('Branch changed to:', activeBranch.name);
      debouncedRefresh();
    }
    
    // Limpeza na desmontagem do componente
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeBranch, debouncedRefresh]);

  // Observar o evento branch-id-updated - usar apenas quando não há mudança direta no activeBranch
  useEffect(() => {
    const handleBranchChange = () => {
      console.log('branch-id-updated event detected');
      // Verificar se o branch ativo mudou realmente
      const storedBranchId = localStorage.getItem('branchId');
      const activeBranchId = activeBranch?.id;
      
      if (storedBranchId !== activeBranchId) {
        console.log('Branch ID changed from event, refreshing data...');
        debouncedRefresh();
      } else {
        console.log('Branch ID unchanged, ignoring event');
      }
    };
    
    window.addEventListener('branch-id-updated', handleBranchChange);
    
    return () => {
      window.removeEventListener('branch-id-updated', handleBranchChange);
    };
  }, [activeBranch, debouncedRefresh]);

  // Retornar object com loading state e função de refresh manual
  return { loading, refresh };
}

export default useBranchChangeRefresh; 