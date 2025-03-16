import React, { useState, useEffect } from 'react';
import { Box, Toolbar, Container, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Atualizar estado do sidebar quando mudar o tamanho da tela
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarWidth = 240;
  const collapsedSidebarWidth = 65;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' 
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Header onMenuToggle={handleSidebarToggle} />
      
      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        <Sidebar 
          open={sidebarOpen} 
          onClose={handleSidebarToggle} 
          width={sidebarWidth}
        />
        
        <Box
          component={motion.main}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: { 
              xs: '100%',
              md: `calc(100% - ${sidebarOpen ? sidebarWidth : collapsedSidebarWidth}px)` 
            },
            marginLeft: { 
              xs: 0,
              md: sidebarOpen ? `${sidebarWidth}px` : `${collapsedSidebarWidth}px`
            },
            transition: theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            zIndex: 5,
          }}
        >
          <Toolbar /> {/* Espaçamento para compensar a altura do cabeçalho fixo */}
          
          {/* Elementos decorativos de fundo */}
          <Box
            sx={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(59, 130, 246, 0.2))' 
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
              filter: 'blur(100px)',
              top: '20%',
              right: '-150px',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(236, 72, 153, 0.2))' 
                : 'linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(236, 72, 153, 0.1))',
              filter: 'blur(100px)',
              bottom: '10%',
              left: '10%',
              zIndex: 0,
            }}
          />
          
          <Container 
            maxWidth="xl" 
            component={motion.div}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            sx={{ 
              mt: 2,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 