import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextData {
  open: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextData>({} as SidebarContextData);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
}; 