import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Avatar,
  Badge,
  IconButton,
  useMediaQuery,
  Toolbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  PriceCheck as PriceCheckIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Discount as PromotionsIcon,
  PersonAdd as NewCustomerIcon,
  Groups as CustomerGroupsIcon,
  AssignmentInd as CustomerProfileIcon,
  Timeline as SalesReportIcon,
  Summarize as InventoryReportIcon,
  QueryStats as AnalyticsIcon,
  ManageAccounts as UserManagementIcon,
  AdminPanelSettings as RolesIcon,
  VpnKey as SecurityIcon,
  StorefrontOutlined as StoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CalendarMonth as CalendarIcon,
  SupportAgent as SupportIcon,
  HelpOutline as HelpIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  width: number;
}

// Interface para os itens de menu
interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactElement;
  badge?: number;
  subItems?: Omit<MenuItem, 'subItems'>[];
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, width }) => {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    produtos: false,
    clientes: false,
    relatorios: false,
    configuracoes: false
  });

  // Define os itens do menu
  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon sx={{ 
        fontSize: 24, 
        color: theme.palette.primary.main,
        filter: `drop-shadow(0 2px 2px ${alpha(theme.palette.primary.main, 0.4)})` 
      }} />
    },
    {
      title: 'Vendas',
      path: '/vendas',
      icon: <ShoppingCartIcon sx={{ 
        fontSize: 24, 
        color: '#0891b2', // Ciano vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#0891b2', 0.4)})` 
      }} />,
      badge: 3
    },
    {
      title: 'Filiais',
      path: '/branches',
      icon: <BusinessIcon sx={{ 
        fontSize: 24, 
        color: '#6366f1', // Índigo vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#6366f1', 0.4)})` 
      }} />
    },
    {
      title: 'Clientes',
      path: '/customers',
      icon: <PeopleIcon sx={{ 
        fontSize: 24, 
        color: '#8b5cf6', // Roxo vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#8b5cf6', 0.4)})` 
      }} />
    },
    {
      title: 'Produtos',
      icon: <InventoryIcon sx={{ 
        fontSize: 24, 
        color: '#10b981', // Verde vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#10b981', 0.4)})` 
      }} />,
      subItems: [
        {
          title: 'Lista de Produtos',
          path: '/produtos',
          icon: <CategoryIcon sx={{ fontSize: 22, color: '#10b981' }} />
        },
        {
          title: 'Preços',
          path: '/produtos/precos',
          icon: <PriceCheckIcon sx={{ fontSize: 22, color: '#10b981' }} />
        },
        {
          title: 'Estoque',
          path: '/produtos/estoque',
          icon: <InventoryIcon sx={{ fontSize: 22, color: '#10b981' }} />,
          badge: 5
        }
      ]
    },
    {
      title: 'Pedidos',
      path: '/pedidos',
      icon: <ReceiptIcon sx={{ 
        fontSize: 24, 
        color: '#f43f5e', // Vermelho-rosa vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#f43f5e', 0.4)})` 
      }} />
    },
    {
      title: 'Fornecedores',
      path: '/fornecedores',
      icon: <ShippingIcon sx={{ 
        fontSize: 24, 
        color: '#0284c7', // Azul vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#0284c7', 0.4)})` 
      }} />
    },
    {
      title: 'Promoções',
      path: '/promocoes',
      icon: <PromotionsIcon sx={{ 
        fontSize: 24, 
        color: '#ec4899', // Rosa vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#ec4899', 0.4)})` 
      }} />
    },
    {
      title: 'Relatórios',
      icon: <ReportsIcon sx={{ 
        fontSize: 24, 
        color: '#f59e0b', // Âmbar vibrante 
        filter: `drop-shadow(0 2px 2px ${alpha('#f59e0b', 0.4)})` 
      }} />,
      subItems: [
        {
          title: 'Vendas',
          path: '/relatorios/vendas',
          icon: <SalesReportIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
        },
        {
          title: 'Estoque',
          path: '/relatorios/estoque',
          icon: <InventoryReportIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
        },
        {
          title: 'Análises',
          path: '/relatorios/analises',
          icon: <AnalyticsIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
        }
      ]
    },
    {
      title: 'Configurações',
      icon: <SettingsIcon sx={{ 
        fontSize: 24, 
        color: '#6b7280', // Cinza médio
        filter: `drop-shadow(0 2px 2px ${alpha('#6b7280', 0.3)})` 
      }} />,
      subItems: [
        {
          title: 'Usuários',
          path: '/configuracoes/usuarios',
          icon: <UserManagementIcon sx={{ fontSize: 22, color: '#6b7280' }} />
        },
        {
          title: 'Perfis de Acesso',
          path: '/configuracoes/perfis',
          icon: <RolesIcon sx={{ fontSize: 22, color: '#6b7280' }} />
        },
        {
          title: 'Segurança',
          path: '/configuracoes/seguranca',
          icon: <SecurityIcon sx={{ fontSize: 22, color: '#6b7280' }} />
        }
      ]
    },
    {
      title: 'Financeiro',
      icon: <MoneyIcon sx={{ 
        fontSize: 24, 
        color: '#16a34a', // Verde escuro vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#16a34a', 0.4)})` 
      }} />,
      subItems: [
        {
          title: 'Contas a Pagar',
          path: '/financeiro/contas-pagar',
          icon: <MoneyIcon sx={{ fontSize: 22, color: '#16a34a' }} />
        },
        {
          title: 'Contas a Receber',
          path: '/financeiro/contas-receber',
          icon: <MoneyIcon sx={{ fontSize: 22, color: '#16a34a' }} />
        },
        {
          title: 'Fluxo de Caixa',
          path: '/financeiro/fluxo-caixa',
          icon: <MoneyIcon sx={{ fontSize: 22, color: '#16a34a' }} />
        }
      ]
    },
    {
      title: 'Agenda',
      path: '/agenda',
      icon: <CalendarIcon sx={{ 
        fontSize: 24, 
        color: '#6366f1', // Índigo vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#6366f1', 0.4)})` 
      }} />
    },
    {
      title: 'Suporte',
      path: '/suporte',
      icon: <SupportIcon sx={{ 
        fontSize: 24, 
        color: '#f43f5e', // Vermelho-rosa vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#f43f5e', 0.4)})` 
      }} />
    },
    {
      title: 'Ajuda',
      path: '/ajuda',
      icon: <HelpIcon sx={{ 
        fontSize: 24, 
        color: '#3b82f6', // Azul vibrante
        filter: `drop-shadow(0 2px 2px ${alpha('#3b82f6', 0.4)})` 
      }} />
    }
  ];

  const handleSubMenuToggle = (key: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Variantes para animação
  const sidebarVariants = {
    open: { width: width, transition: { duration: 0.3 } },
    closed: { width: 65, transition: { duration: 0.3 } }
  };

  const listVariants = {
    open: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    },
    closed: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    closed: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const collapsedDrawerWidth = 65;

  const drawerContent = (
    <motion.div 
      initial={false}
      animate={open ? "open" : "closed"}
      variants={sidebarVariants}
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflowX: 'hidden',
        width: open ? width : collapsedDrawerWidth,
      }}
    >
      {/* Adiciona espaço para evitar sobreposição com o header */}
      <Toolbar />
      
      <Box
        sx={{ 
          width: '100%', 
          height: 'calc(100% - 64px)', // Altura total menos a altura do Toolbar
          display: 'flex', 
          flexDirection: 'column',
          overflowX: 'hidden',
          background: `linear-gradient(165deg, 
            ${alpha(theme.palette.primary.main, 0.08)} 0%, 
            ${alpha(theme.palette.background.paper, 0.98)} 40%, 
            ${theme.palette.background.paper} 100%)`,
          boxShadow: theme.palette.mode === 'light' 
            ? '0 0 20px rgba(0, 0, 0, 0.05), 1px 0 2px rgba(0, 0, 0, 0.05)'
            : '0 0 20px rgba(0, 0, 0, 0.2), 1px 0 2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box
          sx={{
            px: open ? 3 : 1.2,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            gap: 2
          }}
        >
          {open ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    height: 40,
                    width: 40,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  <StoreIcon />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.5px'
                    }}
                  >
                    SuperERP
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 500,
                      letterSpacing: '0.5px'
                    }}
                  >
                    Sistema de Gestão
                  </Typography>
                </Box>
              </Box>
              {!isMobile && (
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                    transition: 'background-color 0.2s',
                    width: 32,
                    height: 32
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              )}
            </>
          ) : (
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                height: 36,
                width: 36,
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <StoreIcon fontSize="small" />
            </Avatar>
          )}
        </Box>

        <Divider sx={{ mx: 2, my: 1, opacity: 0.7 }} />

        <Box 
          component={motion.div}
          variants={listVariants}
          initial="closed"
          animate="open"
          sx={{ 
            overflowY: 'auto', 
            overflowX: 'hidden',
            flex: 1, 
            px: open ? 1.5 : 0.8,
            py: 1.5,
            '&::-webkit-scrollbar': {
              width: 4,
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.background.default, 0.3),
              borderRadius: 10
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 10
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: alpha(theme.palette.primary.main, 0.3)
            }
          }}
        >
          <List sx={{ width: '100%', p: 0 }}>
            {menuItems.map((item, index) => (
              <Box key={item.title} component={motion.div} variants={itemVariants}>
                {item.subItems && open ? (
                  // Menu com submenus (somente quando aberto)
                  <React.Fragment>
                    <ListItemButton
                      onClick={() => handleSubMenuToggle(item.title.toLowerCase())}
                      sx={{
                        mb: 0.5,
                        p: 1.2,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          minWidth: 40,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.3rem',
                            transition: 'all 0.3s ease',
                            transform: openSubMenus[item.title.toLowerCase()] ? 'scale(1.15)' : 'scale(1)'
                          }
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: openSubMenus[item.title.toLowerCase()] ? 600 : 500,
                              color: openSubMenus[item.title.toLowerCase()] 
                                ? theme.palette.primary.main 
                                : 'inherit'
                            }}
                          >
                            {item.title}
                          </Typography>
                        } 
                      />
                      {openSubMenus[item.title.toLowerCase()] ? (
                        <ExpandLessIcon 
                          fontSize="small" 
                          sx={{ 
                            color: openSubMenus[item.title.toLowerCase()] 
                              ? theme.palette.primary.main 
                              : 'inherit' 
                          }}
                        />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      )}
                    </ListItemButton>
                    <Collapse in={openSubMenus[item.title.toLowerCase()]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem) => {
                          const active = isActive(subItem.path);
                          return (
                            <motion.div
                              key={subItem.title}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ListItemButton
                                component={Link}
                                to={subItem.path || '#'}
                                sx={{
                                  pl: 4,
                                  py: 1,
                                  pr: 1.5,
                                  my: 0.3,
                                  borderRadius: 2,
                                  bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                                  color: active ? theme.palette.primary.main : 'inherit',
                                  '&:hover': {
                                    bgcolor: active ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.06)
                                  }
                                }}
                              >
                                <ListItemIcon 
                                  sx={{ 
                                    minWidth: 36,
                                    '& .MuiSvgIcon-root': {
                                      fontSize: '1.1rem'
                                    }
                                  }}
                                >
                                  {subItem.icon}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: active ? 600 : 400,
                                        fontSize: '0.875rem'
                                      }}
                                    >
                                      {subItem.title}
                                    </Typography>
                                  }
                                />
                                {subItem.badge && (
                                  <Badge 
                                    badgeContent={subItem.badge} 
                                    color="primary"
                                    sx={{ 
                                      '& .MuiBadge-badge': {
                                        fontSize: '0.65rem',
                                        height: 16,
                                        minWidth: 16,
                                        padding: '0 4px',
                                        background: 
                                          active 
                                            ? theme.palette.primary.main
                                            : theme.palette.mode === 'light' 
                                              ? alpha(theme.palette.primary.main, 0.8) 
                                              : alpha(theme.palette.primary.light, 0.8),
                                        boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
                                      }
                                    }}
                                  />
                                )}
                              </ListItemButton>
                            </motion.div>
                          );
                        })}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ) : (
                  // Item de menu simples ou contraído
                  <Tooltip
                    title={!open ? item.title : ""}
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      component={Link}
                      to={item.path || (item.subItems && item.subItems[0].path) || '#'}
                      sx={{
                        mb: 0.5,
                        p: open ? 1.2 : 1.4,
                        justifyContent: open ? 'flex-start' : 'center',
                        borderRadius: 2,
                        bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                        color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                        overflow: 'hidden',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.08)
                        },
                        '&:hover::after': isActive(item.path) ? {
                          transform: 'scaleX(1.5) translateY(-50%)',
                          opacity: 0.6
                        } : {},
                        '&::after': isActive(item.path) ? {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          width: 3,
                          height: '60%',
                          borderRadius: '0 4px 4px 0',
                          backgroundColor: theme.palette.primary.main,
                          transform: 'scaleX(1) translateY(-50%)',
                          transformOrigin: 'left',
                          transition: 'transform 0.3s ease, opacity 0.3s ease',
                          opacity: 1
                        } : {}
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          minWidth: open ? 40 : 0,
                          justifyContent: 'center',
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.3rem',
                            transition: 'all 0.3s ease',
                            transform: isActive(item.path) ? 'scale(1.15)' : 'scale(1)'
                          }
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {open && (
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: isActive(item.path) ? 600 : 500
                              }}
                            >
                              {item.title}
                            </Typography>
                          } 
                        />
                      )}
                      {open && item.badge && (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{ 
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              height: 16,
                              minWidth: 16,
                              padding: '0 4px',
                              boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
                            }
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                )}
                {open && (index === 1 || index === 6) && <Divider sx={{ my: 1.5, mx: 2, opacity: 0.5 }} />}
              </Box>
            ))}
          </List>
        </Box>

        {open && (
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                width: 38,
                height: 38
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={600} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.name || 'Usuário'}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'block',
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden', 
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.email || 'email@exemplo.com'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </motion.div>
  );

  return (
    <>
      {/* Drawer para mobile */}
      <Drawer
        variant="temporary"
        open={isMobile && open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true // Melhor desempenho em mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
            border: 'none',
            zIndex: (theme) => theme.zIndex.drawer
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer para desktop - agora responsivo */}
      <Box
        component="nav"
        sx={{
          width: { md: open ? width : collapsedDrawerWidth },
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              position: 'relative',
              boxSizing: 'border-box',
              width: open ? width : collapsedDrawerWidth,
              overflowX: 'hidden',
              border: 'none',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              })
            }
          }}
          open={open}
        >
          {drawerContent}
        </Drawer>
      </Box>
    </>
  );
};

export default Sidebar; 