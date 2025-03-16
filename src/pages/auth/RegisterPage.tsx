import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  FormControl,
  FormHelperText,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  Divider,
  Chip,
  Alert,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  LockOutlined as LockOutlinedIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { tenantService, UserRole, TenantStatus } from '../../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Recupera dados do tenant da navegação, se disponíveis
  const [tenantData, setTenantData] = useState<{
    tenantId: string | null;
    tenantName: string | null;
  }>({
    tenantId: null,
    tenantName: null
  });

  // Verificar se viemos do cadastro de tenant
  useEffect(() => {
    const state = location.state as { tenantId?: string; tenantName?: string } | null;
    if (state?.tenantId) {
      setTenantData({
        tenantId: state.tenantId,
        tenantName: state.tenantName || null
      });
    }
  }, [location]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro quando o usuário começa a digitar novamente
    setErrors({
      ...errors,
      [name]: ''
    });
    
    // Atualizar força da senha se o campo for password
    if (name === 'password') {
      updatePasswordStrength(value);
    }
  };

  const updatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength);
    setPasswordRequirements(requirements);
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else if (passwordStrength < 3) {
      newErrors.password = 'Senha não atende aos requisitos mínimos';
      valid = false;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setRegisterError('');
    
    try {
      // Se temos um tenant ID, registra um usuário vinculado ao tenant
      if (tenantData.tenantId) {
        // Usar o método específico para criar administrador inicial
        await tenantService.createAdminUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          tenantId: tenantData.tenantId
        });
        
        // Após criar o usuário, redireciona para o login
        navigate('/login', { 
          state: { 
            message: 'Usuário administrador criado com sucesso. Faça login para acessar o sistema.' 
          } 
        });
      } else {
        // Fluxo padrão de registro
        await register(formData.name, formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      // Exibir mensagem de erro mais detalhada quando disponível
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        // Extrair mais detalhes do erro quando disponíveis
        let errorMessage = 'Erro desconhecido';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorData.details) {
          console.error('Detalhes do erro:', errorData.details);
          // Se temos detalhes específicos, vamos adicionar à mensagem
          if (typeof errorData.details === 'string') {
            errorMessage += `: ${errorData.details}`;
          } else if (Array.isArray(errorData.details)) {
            errorMessage += `: ${errorData.details.join(', ')}`;
          }
        }
        
        setRegisterError(`Falha ao registrar: ${errorMessage}`);
      } else if (error.message) {
        setRegisterError(`Falha ao registrar: ${error.message}`);
      } else {
        setRegisterError('Falha ao registrar. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return theme.palette.text.disabled;
    if (passwordStrength < 3) return theme.palette.error.main;
    if (passwordStrength < 4) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const decorationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.3
      }
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 
          isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
            : `linear-gradient(135deg, ${alpha('#f8f9fa', 0.97)} 0%, ${alpha('#ffffff', 0.97)} 100%)`,
      }}
    >
      {/* Elementos decorativos de fundo */}
      <Box
        component={motion.div}
        variants={decorationVariants}
        initial="hidden"
        animate="visible"
        sx={{
          position: 'absolute',
          width: '40vh',
          height: '40vh',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          filter: 'blur(80px)',
          top: '-15vh',
          right: '-5vh',
          zIndex: 0,
          opacity: 0.7,
        }}
      />
      
      <Box
        component={motion.div}
        variants={decorationVariants}
        initial="hidden"
        animate="visible"
        sx={{
          position: 'absolute',
          width: '30vh',
          height: '30vh',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
          filter: 'blur(60px)',
          bottom: '-10vh',
          left: '-5vh',
          zIndex: 0,
          opacity: 0.7,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={isDark ? 5 : 2}
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: isDark 
              ? '0 10px 40px rgba(0, 0, 0, 0.3)' 
              : '0 10px 50px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: { md: '600px' },
          }}
        >
          {/* Seção de informações */}
          <Box
            sx={{
              flex: { md: '0 0 45%' },
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              p: 5,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              color: 'white',
              overflow: 'hidden',
            }}
          >
            <Box
              component={motion.div}
              variants={itemVariants}
              sx={{
                position: 'relative',
                zIndex: 2,
              }}
            >
              <Button
                component={RouterLink}
                to={tenantData.tenantId ? "/register-tenant" : "/login"}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'white',
                  mb: 4,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.1),
                  }
                }}
              >
                {tenantData.tenantId 
                  ? 'Voltar para Cadastro de Empresa' 
                  : 'Voltar para Login'}
              </Button>
              
              <Typography 
                variant="h3" 
                fontWeight="bold" 
                gutterBottom 
                sx={{ 
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                {tenantData.tenantId 
                  ? `Cadastro de Administrador para ${tenantData.tenantName}` 
                  : 'Crie sua conta'}
              </Typography>
              
              <Typography 
                variant="h6"
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  maxWidth: 400,
                  fontWeight: 400
                }}
              >
                Junte-se ao SuperERP e tenha acesso a todas as ferramentas de gestão para seu negócio.
              </Typography>
              
              <Box sx={{ mb: 6 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    '& svg': { mr: 2, color: 'white' }
                  }}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <CheckIcon />
                  <Typography>Gestão simplificada de vendas e estoque</Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    '& svg': { mr: 2, color: 'white' }
                  }}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <CheckIcon />
                  <Typography>Relatórios detalhados e insights de negócio</Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    '& svg': { mr: 2, color: 'white' }
                  }}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <CheckIcon />
                  <Typography>Suporte técnico 24/7</Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Elementos decorativos */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '-80px',
                right: '-80px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: alpha('#fff', 0.05),
                zIndex: 1,
              }}
            />
            
            <Box
              sx={{
                position: 'absolute',
                top: '40px',
                right: '-30px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: alpha('#fff', 0.05),
                zIndex: 1,
              }}
            />
          </Box>
          
          {/* Formulário de registro */}
          <Box
            sx={{
              flex: { md: '0 0 55%' },
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            component={motion.div}
            variants={itemVariants}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                maxWidth: '450px',
                mx: 'auto',
              }}
            >
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                mb={1} 
                color="primary" 
                align="center"
                sx={{ display: { md: 'none' } }}
              >
                Crie sua conta
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                mb={4} 
                align="center"
                sx={{ display: { md: 'none' } }}
              >
                Preencha as informações abaixo para criar sua conta
              </Typography>
              
              {registerError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {registerError}
                </Alert>
              )}
              
              {tenantData.tenantId && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Você está criando o usuário administrador para a empresa "{tenantData.tenantName}".
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" error={!!errors.name} sx={{ mb: 2 }}>
                    <TextField
                      label="Nome completo"
                      variant="outlined"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color={errors.name ? "error" : "primary"} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" error={!!errors.email} sx={{ mb: 2 }}>
                    <TextField
                      label="Email"
                      variant="outlined"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color={errors.email ? "error" : "primary"} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" error={!!errors.password} sx={{ mb: 2 }}>
                    <TextField
                      label="Senha"
                      variant="outlined"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color={errors.password ? "error" : "primary"} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </FormControl>
                  
                  {/* Indicador de força da senha */}
                  {formData.password && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" mr={2}>
                          Força da senha:
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 4,
                            bgcolor: alpha(theme.palette.text.disabled, 0.1),
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${passwordStrength * 20}%`,
                              bgcolor: getPasswordStrengthColor(),
                              borderRadius: 'inherit',
                              transition: 'width 0.3s ease, background-color 0.3s ease'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" ml={1} sx={{ color: getPasswordStrengthColor() }}>
                          {passwordStrength === 0 && 'Nenhuma'}
                          {passwordStrength === 1 && 'Fraca'}
                          {passwordStrength === 2 && 'Fraca'}
                          {passwordStrength === 3 && 'Média'}
                          {passwordStrength === 4 && 'Forte'}
                          {passwordStrength === 5 && 'Excelente'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          label="8+ caracteres"
                          color={passwordRequirements.length ? "success" : "default"}
                          variant={passwordRequirements.length ? "filled" : "outlined"}
                          sx={{ opacity: passwordRequirements.length ? 1 : 0.7 }}
                        />
                        <Chip
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          label="Maiúscula"
                          color={passwordRequirements.uppercase ? "success" : "default"}
                          variant={passwordRequirements.uppercase ? "filled" : "outlined"}
                          sx={{ opacity: passwordRequirements.uppercase ? 1 : 0.7 }}
                        />
                        <Chip
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          label="Minúscula"
                          color={passwordRequirements.lowercase ? "success" : "default"}
                          variant={passwordRequirements.lowercase ? "filled" : "outlined"}
                          sx={{ opacity: passwordRequirements.lowercase ? 1 : 0.7 }}
                        />
                        <Chip
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          label="Número"
                          color={passwordRequirements.number ? "success" : "default"}
                          variant={passwordRequirements.number ? "filled" : "outlined"}
                          sx={{ opacity: passwordRequirements.number ? 1 : 0.7 }}
                        />
                        <Chip
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          label="Especial"
                          color={passwordRequirements.special ? "success" : "default"}
                          variant={passwordRequirements.special ? "filled" : "outlined"}
                          sx={{ opacity: passwordRequirements.special ? 1 : 0.7 }}
                        />
                      </Box>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" error={!!errors.confirmPassword} sx={{ mb: 3 }}>
                    <TextField
                      label="Confirme a senha"
                      variant="outlined"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon color={errors.confirmPassword ? "error" : "primary"} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px ' + alpha(theme.palette.primary.main, 0.4),
                  '&:hover': {
                    boxShadow: '0 6px 16px ' + alpha(theme.palette.primary.main, 0.5),
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Criar conta'
                )}
              </Button>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Divider sx={{ my: 2 }}>
                  <Chip 
                    label="ou" 
                    size="small" 
                    sx={{ 
                      px: 1, 
                      fontSize: '0.75rem',
                      bgcolor: alpha(theme.palette.divider, 0.08)
                    }} 
                  />
                </Divider>
                
                <Typography variant="body2" color="text.secondary">
                  Já tem uma conta?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    color="primary"
                    sx={{ 
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Faça login aqui
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 