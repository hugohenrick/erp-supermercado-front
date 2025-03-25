import { useEffect, useState, useCallback } from 'react';
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
  
  // Wrap the refresh function to handle loading state
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await refreshFunction();
    } finally {
      setLoading(false);
    }
  }, [refreshFunction]);

  // Listen for branch changes and refresh data
  useEffect(() => {
    console.log('Branch changed, refreshing data:', activeBranch?.name);
    if (activeBranch) {
      // Reset to first page when branch changes (if setPage function is provided)
      if (setPage) {
        setPage(0);
      }
      
      // Add a small delay to ensure interceptors have been updated with the new branchId
      setTimeout(() => {
        refresh();
      }, 100);
    }
  }, [activeBranch, refresh, setPage]);

  // Listen for the branch-id-updated event
  useEffect(() => {
    const handleBranchChange = () => {
      console.log('branch-id-updated event detected, refreshing data...');
      
      // Reset to first page when branch changes (if setPage function is provided)
      if (setPage) {
        setPage(0);
      }
      
      refresh();
    };
    
    window.addEventListener('branch-id-updated', handleBranchChange);
    
    return () => {
      window.removeEventListener('branch-id-updated', handleBranchChange);
    };
  }, [refresh, setPage]);

  return { loading, refresh };
}

export default useBranchChangeRefresh; 