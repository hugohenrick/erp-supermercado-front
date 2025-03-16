import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  FormControl,
  FormHelperText,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Grid,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Switch,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  DocumentScanner as DocumentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  BusinessCenter as PlanIcon,
  Store as StoreIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  ArrowForward as ArrowForwardIcon,
  GroupAdd as GroupAddIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PlanType, Tenant, tenantService, TenantStatus } from '../../services/api';
import { formatCNPJ, cleanCNPJ, validateCNPJ, formatPhone, cleanPhone } from '../../utils/documentUtils';

const TenantRegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<Tenant, 'id' | 'status' | 'schema' | 'createdAt' | 'updatedAt'>>({
    name: '',
    document: '',
    email: '',
    phone: '',
    planType: PlanType.STANDARD,
    maxBranches: 1,
  });

  // Estados para controle de UI
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  const [createdTenantId, setCreatedTenantId] = useState<string>('');

  // Manipuladores de evento
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<PlanType | number>
  ) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    let formattedValue: any = value;

    // Formata valores específicos
    if (name === 'document') {
      formattedValue = formatCNPJ(value as string);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value as string);
    } else if (name === 'maxBranches') {
      // Garante que o valor seja um número e não menor que 1
      formattedValue = Math.max(1, parseInt(value as string) || 1);
    }

    setFormData({
      ...formData,
      [name]: formattedValue
    });
    
    // Limpa erro do campo quando o usuário edita
    setErrors({
      ...errors,
      [name]: ''
    });
  };
  
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: Record<string, string> = {};
    
    // Validação do Nome da Empresa
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
      valid = false;
    }
    
    // Validação do CNPJ
    if (!formData.document.trim()) {
      newErrors.document = 'CNPJ é obrigatório';
      valid = false;
    } else if (!validateCNPJ(formData.document)) {
      newErrors.document = 'CNPJ inválido';
      valid = false;
    }
    
    // Validação do Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    }
    
    // Validação do Telefone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
      valid = false;
    } else if (cleanPhone(formData.phone).length < 10) {
      newErrors.phone = 'Telefone inválido';
      valid = false;
    }
    
    // Validação do Plano
    if (!formData.planType) {
      newErrors.planType = 'Selecione um plano';
      valid = false;
    }
    
    // Validação de Filiais
    if (formData.maxBranches < 1) {
      newErrors.maxBranches = 'Número de filiais deve ser pelo menos 1';
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
      // Prepara os dados para envio
      const tenantData: Tenant = {
        ...formData,
        document: cleanCNPJ(formData.document),
        phone: cleanPhone(formData.phone),
        status: TenantStatus.ACTIVE,
        planType: formData.planType,
        maxBranches: Math.max(1, formData.maxBranches || 1),
      };
      
      console.log('Enviando dados:', tenantData);
      
      // Chama a API para criar o tenant
      const response = await tenantService.createTenant(tenantData);
      
      // Armazena o ID do tenant criado para uso posterior no registro de usuário
      if (response && response.id) {
        setCreatedTenantId(response.id);
        setRegisterSuccess(true);
        
        // Redireciona para a página de cadastro de usuário com o ID do tenant
        navigate('/register', { state: { tenantId: response.id, tenantName: response.name } });
      } else {
        throw new Error('Resposta da API não contém ID do tenant');
      }
    } catch (error: any) {
      console.error('Erro no registro do tenant:', error);
      // Exibir mensagem de erro mais detalhada quando disponível
      if (error.response && error.response.data) {
        setRegisterError(`Falha ao registrar empresa: ${error.response.data.message || 'Erro desconhecido'}`);
      } else {
        setRegisterError('Falha ao registrar empresa. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Variantes para animações com Framer Motion
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
                to="/login"
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'white',
                  mb: 4,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.1),
                  }
                }}
              >
                Voltar para Login
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
                Cadastre sua Empresa
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
                Crie sua conta empresarial para acessar o SuperERP e gerenciar seu negócio de forma eficiente.
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
                  <Typography>Controle completo de estoque e vendas</Typography>
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
                  <Typography>Gerenciamento de múltiplas filiais</Typography>
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
                  <Typography>Relatórios detalhados e dashboards</Typography>
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
                  <Typography>Suporte técnico especializado</Typography>
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
                Cadastre sua Empresa
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                mb={4} 
                align="center"
                sx={{ display: { md: 'none' } }}
              >
                Preencha as informações abaixo para registrar sua empresa
              </Typography>
              
              {registerError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {registerError}
                </Alert>
              )}
              
              {registerSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Empresa cadastrada com sucesso! Agora vamos cadastrar seu usuário administrador.
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" error={!!errors.name} sx={{ mb: 2 }}>
                    <TextField
                      label="Nome da Empresa"
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
                            <BusinessIcon color={errors.name ? "error" : "primary"} />
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
                  <FormControl fullWidth variant="outlined" error={!!errors.document} sx={{ mb: 2 }}>
                    <TextField
                      label="CNPJ"
                      variant="outlined"
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      error={!!errors.document}
                      helperText={errors.document}
                      placeholder="00.000.000/0000-00"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DocumentIcon color={errors.document ? "error" : "primary"} />
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
                      label="Email Corporativo"
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
                  <FormControl fullWidth variant="outlined" error={!!errors.phone} sx={{ mb: 2 }}>
                    <TextField
                      label="Telefone"
                      variant="outlined"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      placeholder="(00) 00000-0000"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color={errors.phone ? "error" : "primary"} />
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
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2, mt: 1 }}>
                    Plano e Configurações
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={7}>
                  <FormControl fullWidth variant="outlined" error={!!errors.planType} sx={{ mb: 2 }}>
                    <InputLabel id="plan-type-label">Tipo de Plano</InputLabel>
                    <Select
                      labelId="plan-type-label"
                      id="plan-type"
                      name="planType"
                      value={formData.planType}
                      onChange={handleInputChange}
                      label="Tipo de Plano"
                      startAdornment={
                        <InputAdornment position="start">
                          <PlanIcon color={errors.planType ? "error" : "primary"} />
                        </InputAdornment>
                      }
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      <MenuItem value={PlanType.BASIC}>Básico</MenuItem>
                      <MenuItem value={PlanType.STANDARD}>Padrão</MenuItem>
                      <MenuItem value={PlanType.PREMIUM}>Premium</MenuItem>
                      <MenuItem value={PlanType.ENTERPRISE}>Empresarial</MenuItem>
                    </Select>
                    {errors.planType && <FormHelperText>{errors.planType}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth variant="outlined" error={!!errors.maxBranches} sx={{ mb: 2 }}>
                    <TextField
                      label="Número de Filiais"
                      variant="outlined"
                      name="maxBranches"
                      type="number"
                      value={formData.maxBranches}
                      onChange={handleInputChange}
                      error={!!errors.maxBranches}
                      helperText={errors.maxBranches}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <StoreIcon color={errors.maxBranches ? "error" : "primary"} />
                          </InputAdornment>
                        ),
                        inputProps: { min: 1 }
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
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                      Próximos passos:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Após cadastrar sua empresa, você será redirecionado para criar o usuário administrador do sistema.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  color="primary"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GroupAddIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      background: `linear-gradient(90deg, ${alpha('#fff', 0)}, ${alpha('#fff', 0.3)}, ${alpha('#fff', 0)})`,
                      transform: 'translateX(-100%)',
                    },
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&::after': {
                        transform: 'translateX(100%)',
                        transition: 'transform 0.6s ease',
                      },
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Empresa'}
                </Button>
              </Box>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Já tem uma conta?{' '}
                  <RouterLink 
                    to="/login" 
                    style={{ 
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Faça login
                  </RouterLink>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TenantRegisterPage; 