import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormHelperText,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChevronLeft as ChevronLeftIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactPhoneIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Branch, BranchStatus, BranchType, branchService } from '../../services/api';
import { useSnackbar } from 'notistack';
import { cleanCNPJ, formatCNPJ, validateCNPJ } from '../../utils/documentUtils';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

// Tipo para gerenciar erros de formulário
interface FormErrors {
  name?: string;
  code?: string;
  type?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

const BranchFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = !!id;
  
  // Estado inicial da filial
  const initialBranchState: Branch = {
    name: '',
    code: '',
    type: BranchType.BRANCH,
    document: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil'
    },
    phone: '',
    email: '',
    isMain: false
  };
  
  // Estados
  const [branch, setBranch] = useState<Branch>(initialBranchState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Efeito para carregar dados da filial no modo de edição
  useEffect(() => {
    const fetchBranch = async () => {
      if (isEditMode && id) {
        setFetchLoading(true);
        setFetchError(null);
        
        try {
          const data = await branchService.getBranchById(id);
          setBranch(data);
        } catch (error) {
          console.error('Erro ao carregar dados da filial:', error);
          setFetchError('Não foi possível carregar os dados da filial. Tente novamente mais tarde.');
        } finally {
          setFetchLoading(false);
        }
      }
    };
    
    fetchBranch();
  }, [id, isEditMode]);
  
  // Manipulador para alterações nos campos do formulário
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    
    if (name.includes('.')) {
      // Campos aninhados (endereço)
      const [parent, child] = name.split('.');
      setBranch(prev => {
        // Garantir que estamos tratando de um objeto
        const parentObj = prev[parent as keyof Branch] as Record<string, any> || {};
        
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
      
      // Limpar erros
      if (errors.address && errors.address[child as keyof typeof errors.address]) {
        setErrors(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: undefined
          }
        }));
      }
    } else if (name === 'isMain') {
      // Checkbox
      setBranch(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'document') {
      // Formatar CNPJ
      const formattedDocument = formatCNPJ(value);
      setBranch(prev => ({
        ...prev,
        [name]: formattedDocument
      }));
      
      // Limpar erro
      if (errors[name as keyof FormErrors]) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    } else {
      // Campos normais
      setBranch(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Limpar erro
      if (errors[name as keyof FormErrors]) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    }
  };
  
  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Validar nome
    if (!branch.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }
    
    // Validar código
    if (!branch.code.trim()) {
      newErrors.code = 'Código é obrigatório';
      isValid = false;
    }
    
    // Validar tipo
    if (!branch.type) {
      newErrors.type = 'Tipo é obrigatório';
      isValid = false;
    }
    
    // Validar CNPJ
    if (!branch.document.trim()) {
      newErrors.document = 'CNPJ é obrigatório';
      isValid = false;
    } else if (!validateCNPJ(cleanCNPJ(branch.document))) {
      newErrors.document = 'CNPJ inválido';
      isValid = false;
    }
    
    // Validar telefone
    if (!branch.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
      isValid = false;
    }
    
    // Validar email
    if (!branch.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(branch.email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }
    
    // Validar campos de endereço
    const addressErrors: FormErrors['address'] = {};
    
    if (!branch.address.street.trim()) {
      addressErrors.street = 'Rua é obrigatória';
      isValid = false;
    }
    
    if (!branch.address.number.trim()) {
      addressErrors.number = 'Número é obrigatório';
      isValid = false;
    }
    
    if (!branch.address.district.trim()) {
      addressErrors.district = 'Bairro é obrigatório';
      isValid = false;
    }
    
    if (!branch.address.city.trim()) {
      addressErrors.city = 'Cidade é obrigatória';
      isValid = false;
    }
    
    if (!branch.address.state.trim()) {
      addressErrors.state = 'Estado é obrigatório';
      isValid = false;
    }
    
    if (!branch.address.zipCode.trim()) {
      addressErrors.zipCode = 'CEP é obrigatório';
      isValid = false;
    }
    
    if (!branch.address.country.trim()) {
      addressErrors.country = 'País é obrigatório';
      isValid = false;
    }
    
    if (Object.keys(addressErrors).length > 0) {
      newErrors.address = addressErrors;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Manipulador para envio do formulário
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Por favor, corrija os erros no formulário antes de enviar.', { variant: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && id) {
        // Modo de edição
        await branchService.updateBranch(id, branch);
        enqueueSnackbar('Filial atualizada com sucesso!', { variant: 'success' });
      } else {
        // Modo de criação
        await branchService.createBranch(branch);
        enqueueSnackbar('Filial criada com sucesso!', { variant: 'success' });
      }
      
      // Redirecionar para a lista de filiais
      navigate('/branches');
    } catch (error) {
      console.error('Erro ao salvar filial:', error);
      enqueueSnackbar('Erro ao salvar filial. Tente novamente.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Manipulador para cancelar
  const handleCancel = () => {
    navigate('/branches');
  };
  
  if (fetchLoading) {
    return (
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }
  
  if (fetchError) {
    return (
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/branches')}>
                Voltar
              </Button>
            }
          >
            {fetchError}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }
  
  // Renderização principal
  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <Tooltip title="Voltar para a lista de filiais">
                  <IconButton
                    component={RouterLink}
                    to="/branches"
                    sx={{ 
                      mr: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <BusinessIcon fontSize="large" color="primary" />
                  {isEditMode ? 'Editar Filial' : 'Nova Filial'}
                </Typography>
              </Grid>
            </Grid>
            
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/dashboard" color="inherit">
                Dashboard
              </Link>
              <Link component={RouterLink} to="/branches" color="inherit">
                Filiais
              </Link>
              <Typography color="text.primary">
                {isEditMode ? 'Editar' : 'Nova'}
              </Typography>
            </Breadcrumbs>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Informações Básicas */}
              <Grid item xs={12}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    borderRadius: 2,
                    boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                    overflow: 'hidden'
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        mb: 3
                      }}
                    >
                      <BusinessIcon fontSize="small" color="primary" />
                      Informações Básicas
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome da Filial"
                          name="name"
                          value={branch.name}
                          onChange={handleChange}
                          error={!!errors.name}
                          helperText={errors.name}
                          required
                          variant="outlined"
                          placeholder="Ex: Loja Centro"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Código da Filial"
                          name="code"
                          value={branch.code}
                          onChange={handleChange}
                          error={!!errors.code}
                          helperText={errors.code}
                          required
                          variant="outlined"
                          placeholder="Ex: LOJA001"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          select
                          fullWidth
                          label="Tipo de Filial"
                          name="type"
                          value={branch.type}
                          onChange={handleChange}
                          error={!!errors.type}
                          helperText={errors.type}
                          required
                          variant="outlined"
                        >
                          <MenuItem value={BranchType.MAIN}>Matriz</MenuItem>
                          <MenuItem value={BranchType.BRANCH}>Filial</MenuItem>
                          <MenuItem value={BranchType.WAREHOUSE}>Depósito</MenuItem>
                          <MenuItem value={BranchType.DISTRIBUTION}>Centro de Distribuição</MenuItem>
                          <MenuItem value={BranchType.OTHER}>Outro</MenuItem>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="CNPJ"
                          name="document"
                          value={branch.document}
                          onChange={handleChange}
                          error={!!errors.document}
                          helperText={errors.document}
                          required
                          variant="outlined"
                          placeholder="00.000.000/0000-00"
                          inputProps={{ maxLength: 18 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={branch.email}
                          onChange={handleChange}
                          error={!!errors.email}
                          helperText={errors.email}
                          required
                          variant="outlined"
                          placeholder="filial@exemplo.com"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Telefone"
                          name="phone"
                          value={branch.phone}
                          onChange={handleChange}
                          error={!!errors.phone}
                          helperText={errors.phone}
                          required
                          variant="outlined"
                          placeholder="(00) 0000-0000"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={branch.isMain}
                              onChange={handleChange}
                              name="isMain"
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">Esta é a matriz principal</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Marque esta opção se esta for a filial matriz da empresa
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Endereço */}
              <Grid item xs={12}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    borderRadius: 2,
                    boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                    overflow: 'hidden'
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        mb: 3
                      }}
                    >
                      <LocationIcon fontSize="small" color="primary" />
                      Endereço
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Rua"
                          name="address.street"
                          value={branch.address.street}
                          onChange={handleChange}
                          error={!!errors.address?.street}
                          helperText={errors.address?.street}
                          required
                          variant="outlined"
                          placeholder="Nome da rua"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Número"
                          name="address.number"
                          value={branch.address.number}
                          onChange={handleChange}
                          error={!!errors.address?.number}
                          helperText={errors.address?.number}
                          required
                          variant="outlined"
                          placeholder="Ex: 123"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Complemento"
                          name="address.complement"
                          value={branch.address.complement || ''}
                          onChange={handleChange}
                          variant="outlined"
                          placeholder="Ex: Sala 101"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Bairro"
                          name="address.district"
                          value={branch.address.district}
                          onChange={handleChange}
                          error={!!errors.address?.district}
                          helperText={errors.address?.district}
                          required
                          variant="outlined"
                          placeholder="Nome do bairro"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Cidade"
                          name="address.city"
                          value={branch.address.city}
                          onChange={handleChange}
                          error={!!errors.address?.city}
                          helperText={errors.address?.city}
                          required
                          variant="outlined"
                          placeholder="Nome da cidade"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Estado"
                          name="address.state"
                          value={branch.address.state}
                          onChange={handleChange}
                          error={!!errors.address?.state}
                          helperText={errors.address?.state}
                          required
                          variant="outlined"
                          placeholder="UF"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="CEP"
                          name="address.zipCode"
                          value={branch.address.zipCode}
                          onChange={handleChange}
                          error={!!errors.address?.zipCode}
                          helperText={errors.address?.zipCode}
                          required
                          variant="outlined"
                          placeholder="00000-000"
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="País"
                          name="address.country"
                          value={branch.address.country}
                          onChange={handleChange}
                          error={!!errors.address?.country}
                          helperText={errors.address?.country}
                          required
                          variant="outlined"
                          placeholder="Nome do país"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Botões */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    startIcon={<CancelIcon />}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                    sx={{
                      fontWeight: 600,
                      boxShadow: 2,
                      borderRadius: 2,
                      px: 3,
                      py: 1.2
                    }}
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </DashboardLayout>
  );
};

export default BranchFormPage; 