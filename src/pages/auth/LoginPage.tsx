import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Zoom,
  useTheme,
  useMediaQuery,
  CssBaseline
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Email as EmailIcon,
  Login as LoginIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Verifica se há mensagem de sucesso no state da rota
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Limpar o state da rota para não mostrar a mensagem novamente em recargas
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo quando o usuário digita
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    // Validar email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    } else {
      newErrors.email = '';
    }
    
    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else {
      newErrors.password = '';
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('Tentando login com:', { 
          email: formData.email, 
          password: '••••••••'
        });
        
        const success = await login(formData.email, formData.password);
        
        if (success) {
          // Redirecionar para a página inicial ou dashboard
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Erro no login:', error);
        
        // O erro já será tratado pelo contexto de autenticação
        // Este bloco serve apenas para lidar com erros não tratados pelo contexto
        if (!error.handled) {
          const errorMessage = error.message || 'Falha no login. Verifique suas credenciais e tente novamente.';
          // Exibir mensagem de erro adicional se necessário
          console.error('Erro não tratado pelo contexto:', errorMessage);
        }
      }
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)' 
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Elementos decorativos */}
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.7), rgba(59, 130, 246, 0.7))' 
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))',
          filter: 'blur(80px)',
          top: '-50px',
          right: '-50px',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, rgba(244, 114, 182, 0.7), rgba(236, 72, 153, 0.7))' 
            : 'linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(236, 72, 153, 0.3))',
          filter: 'blur(80px)',
          bottom: '0',
          left: '15%',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.7), rgba(52, 211, 153, 0.7))' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(52, 211, 153, 0.3))',
          filter: 'blur(80px)',
          top: '30%',
          left: '-50px',
          zIndex: 0,
        }}
      />
      
      <Container maxWidth="lg" sx={{ zIndex: 1, py: 5 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: '90vh' }}>
          {/* Coluna da esquerda - Informações */}
          <Grid 
            item 
            xs={12} 
            md={6} 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              pr: 8,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <StorefrontIcon 
                sx={{ 
                  fontSize: 56, 
                  color: theme.palette.primary.main,
                  mb: 3,
                  filter: 'drop-shadow(0 10px 10px rgba(37, 99, 235, 0.3))',
                }} 
              />
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 800,
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(to right, #2563eb, #60a5fa)' 
                    : 'linear-gradient(to right, #60a5fa, #93c5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                SuperERP
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
                Sistema de Gestão para Supermercados
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '80%' }}>
                Controle de estoque, vendas, clientes e muito mais em uma plataforma completa e intuitiva.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {['Vendas', 'Estoque', 'Relatórios', 'Clientes', 'Financeiro'].map((feature) => (
                  <Box 
                    key={feature}
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      px: 2, 
                      py: 1, 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          </Grid>
          
          {/* Coluna da direita - Formulário de Login */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper 
                elevation={3} 
                sx={{ 
                  p: { xs: 3, sm: 5 }, 
                  borderRadius: 3,
                  background: theme.palette.mode === 'light' 
                    ? 'rgba(255, 255, 255, 0.9)' 
                    : 'rgba(30, 41, 59, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: theme.palette.mode === 'light' 
                    ? '1px solid rgba(255, 255, 255, 0.5)' 
                    : '1px solid rgba(30, 41, 59, 0.5)',
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    mb: 4
                  }}
                >
                  <Box 
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    Bem-vindo!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Acesse sua conta para gerenciar seu supermercado
                  </Typography>
                </Box>
                
                {error && (
                  <Zoom in={!!error}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {error}
                    </Alert>
                  </Zoom>
                )}
                
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {successMessage}
                  </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleShowPassword}
                            edge="end"
                            sx={{ color: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ 
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Esqueci minha senha
                      </Typography>
                    </Link>
                  </Box>
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 1, 
                      mb: 2, 
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)',
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.18)',
                      }
                    }}
                    disabled={isLoading}
                    startIcon={isLoading ? null : <LoginIcon />}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                  
                  {/* Links de opções */}
                  <Grid container spacing={1} sx={{ mt: 3 }}>
                    <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Não tem uma conta?{' '}
                        <Link 
                          to="/register" 
                          style={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 500 
                          }}
                        >
                          Cadastre-se
                        </Link>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                      <Typography variant="body2" color="text.secondary">
                        É uma empresa?{' '}
                        <Link 
                          to="/register-tenant" 
                          style={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 500 
                          }}
                        >
                          Cadastre sua empresa
                        </Link>
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      mt: 5
                    }}
                  >
                    <Button
                      component={Link}
                      to="/register-tenant"
                      variant="outlined"
                      color="primary"
                      size="large"
                      startIcon={<StorefrontIcon />}
                      sx={{ 
                        borderRadius: 2,
                        py: 1.2,
                        width: '100%',
                        maxWidth: 300,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        mb: 1
                      }}
                    >
                      Quero cadastrar minha empresa
                    </Button>
                    <Typography variant="caption" color="text.secondary" align="center">
                      Crie sua conta empresarial e comece a gerenciar seu negócio
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage; 