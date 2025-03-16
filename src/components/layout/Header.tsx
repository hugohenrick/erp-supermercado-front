import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Badge, 
  Menu, 
  MenuItem, 
  Divider,
  ListItemIcon,
  Avatar,
  Tooltip,
  useTheme as useMuiTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../ui/SearchBar';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);
  
  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setNotificationsAnchorEl(null);
    setUserMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };
  
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/perfil');
  };
  
  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/configuracoes');
  };
  
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };
  
  // Exemplo de notificações
  const notifications = [
    { id: 1, text: 'Novo pedido recebido', read: false, time: '10 min atrás' },
    { id: 2, text: 'Estoque baixo para Arroz Integral', read: false, time: '30 min atrás' },
    { id: 3, text: 'Relatório mensal disponível', read: true, time: '2 horas atrás' }
  ];
  
  const unreadNotifications = notifications.filter(notification => !notification.read).length;
  
  const notificationsMenu = (
    <Menu
      anchorEl={notificationsAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationsMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
          mt: 1.5,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: muiTheme.palette.mode === 'light' 
            ? '0 10px 40px -10px rgba(0,0,0,0.2)' 
            : '0 10px 40px -10px rgba(0,0,0,0.5)',
          border: muiTheme.palette.mode === 'light' 
            ? '1px solid rgba(0,0,0,0.05)' 
            : '1px solid rgba(255,255,255,0.05)'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>Notificações</Typography>
        <Badge badgeContent={unreadNotifications} color="error" variant="dot">
          <NotificationsIcon fontSize="small" color="action" />
        </Badge>
      </Box>
      <Divider />
      <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2">Nenhuma notificação</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              sx={{ 
                py: 1.5,
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                },
                ...(notification.read ? {} : {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.05),
                })
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                flexDirection: 'column',
                width: '100%',
                position: 'relative'
              }}>
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      position: 'absolute',
                      left: -12,
                      top: 6,
                      boxShadow: '0 0 0 3px ' + alpha(muiTheme.palette.primary.main, 0.2)
                    }}
                  />
                )}
                <Typography variant="body1" fontWeight={notification.read ? 400 : 600}>
                  {notification.text}
                </Typography>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 500 }}>
                    {notification.read ? 'Arquivar' : 'Marcar como lido'}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
      </Box>
      <Divider />
      <MenuItem sx={{ justifyContent: 'center', py: 1.5 }}>
        <Typography variant="body2" color="primary" fontWeight={500}>
          Ver todas
        </Typography>
      </MenuItem>
    </Menu>
  );
  
  const userMenu = (
    <Menu
      anchorEl={userMenuAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isUserMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: { 
          width: 220,
          mt: 1.5,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: muiTheme.palette.mode === 'light' 
            ? '0 10px 40px -10px rgba(0,0,0,0.2)' 
            : '0 10px 40px -10px rgba(0,0,0,0.5)',
          border: muiTheme.palette.mode === 'light' 
            ? '1px solid rgba(0,0,0,0.05)' 
            : '1px solid rgba(255,255,255,0.05)'
        }
      }}
    >
      <Box 
        sx={{ 
          px: 2, 
          py: 2.5,
          background: 'linear-gradient(to right, ' + alpha(muiTheme.palette.primary.main, 0.1) + ', ' + alpha(muiTheme.palette.primary.light, 0.1) + ')',
          borderBottom: '1px solid ' + alpha(muiTheme.palette.divider, 0.5)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 42, 
              height: 42, 
              bgcolor: muiTheme.palette.primary.main,
              border: '2px solid ' + muiTheme.palette.background.paper,
              boxShadow: '0 2px 8px ' + alpha(muiTheme.palette.primary.main, 0.4)
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {user?.name || 'Usuário'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email || 'email@exemplo.com'}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ py: 1 }}>
        <MenuItem 
          onClick={handleProfileClick} 
          sx={{ 
            py: 1.2,
            transition: 'all 0.2s ease',
            mx: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PersonIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500}>Perfil</Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleSettingsClick}
          sx={{ 
            py: 1.2,
            transition: 'all 0.2s ease',
            mx: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SettingsIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500}>Configurações</Typography>
        </MenuItem>
      </Box>
      <Divider sx={{ my: 0.5 }} />
      <Box sx={{ py: 1 }}>
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.2,
            transition: 'all 0.2s ease',
            mx: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.error.main, 0.1),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500} color="error">Sair</Typography>
        </MenuItem>
      </Box>
    </Menu>
  );
  
  return (
    <AppBar 
      position="fixed" 
      color="default" 
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: alpha(muiTheme.palette.background.paper, muiTheme.palette.mode === 'light' ? 0.9 : 0.8),
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid ' + alpha(muiTheme.palette.divider, 0.08),
        boxShadow: muiTheme.palette.mode === 'light' 
          ? '0 4px 20px rgba(0, 0, 0, 0.05)' 
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuToggle}
            sx={{ 
              mr: 2,
              color: muiTheme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box component={motion.div} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon 
                sx={{ 
                  color: muiTheme.palette.primary.main, 
                  mr: 1,
                  fontSize: 28,
                  filter: 'drop-shadow(0 2px 4px ' + alpha(muiTheme.palette.primary.main, 0.4) + ')'
                }} 
              />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ 
                  display: { xs: 'none', sm: 'block' }, 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, ' + muiTheme.palette.primary.main + ', ' + muiTheme.palette.primary.light + ')',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                SuperERP
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {showSearch ? (
          <SearchBar onClose={toggleSearch} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Pesquisar">
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={toggleSearch}
                sx={{ 
                  color: muiTheme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                    color: muiTheme.palette.primary.main
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Alternar tema">
              <IconButton
                color="inherit"
                aria-label="toggle theme"
                onClick={toggleTheme}
                sx={{ 
                  ml: 1,
                  color: mode === 'dark' ? muiTheme.palette.primary.light : muiTheme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.1)
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notificações">
              <IconButton
                color="inherit"
                aria-label="notifications"
                onClick={handleNotificationsMenuOpen}
                sx={{ 
                  ml: 1,
                  color: unreadNotifications > 0 ? muiTheme.palette.warning.main : muiTheme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(unreadNotifications > 0 ? muiTheme.palette.warning.main : muiTheme.palette.primary.main, 0.1),
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Badge 
                  badgeContent={unreadNotifications} 
                  color="error"
                  sx={{ 
                    '& .MuiBadge-badge': {
                      bgcolor: muiTheme.palette.error.main,
                      boxShadow: '0 0 0 2px ' + muiTheme.palette.background.paper
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Conta">
              <IconButton
                onClick={handleUserMenuOpen}
                color="inherit"
                aria-label="account"
                sx={{ 
                  ml: 1.5,
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.1)
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 34, 
                    height: 34, 
                    bgcolor: muiTheme.palette.primary.main,
                    color: '#fff',
                    border: '2px solid ' + muiTheme.palette.background.paper,
                    boxShadow: '0 2px 8px ' + alpha(muiTheme.palette.primary.main, 0.4),
                    fontWeight: 'bold',
                    fontSize: '0.95rem'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
      {notificationsMenu}
      {userMenu}
    </AppBar>
  );
};

export default Header; 