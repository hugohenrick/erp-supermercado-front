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
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Drawer,
  useMediaQuery
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactPhoneIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Customer, PersonType, CustomerType, TaxRegime, Address, customerService } from '../../services/api';
import { cleanCNPJ, formatCNPJ, validateCNPJ } from '../../utils/documentUtils';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';

// Define Status enum if not available in API imports
enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked"
}

// Define Contact interface if not exported from API
interface Contact {
  name: string;
  department: string;
  phone: string;
  mobilePhone: string;
  email: string;
  position: string;
  mainContact: boolean;
}

// Tipo para gerenciar erros de formulário
interface FormErrors {
  name?: string;
  document?: string;
  personType?: string;
  stateDocument?: string;
  cityDocument?: string;
  taxRegime?: string;
  customerType?: string;
  creditLimit?: string;
  paymentTerm?: string;
  email?: string;
  website?: string;
  addresses?: Array<{
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }>;
  contacts?: Array<{
    name?: string;
    phone?: string;
    email?: string;
  }>;
}

// Interface para as props do componente CustomerFormPage
interface CustomerFormPageProps {
  viewOnly?: boolean;
}

const CustomerFormPage: React.FC<CustomerFormPageProps> = ({ viewOnly = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = !!id;
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Referências para as seções
  const basicInfoRef = React.useRef<HTMLDivElement>(null);
  const addressesRef = React.useRef<HTMLDivElement>(null);
  const contactsRef = React.useRef<HTMLDivElement>(null);
  const financialRef = React.useRef<HTMLDivElement>(null);
  const observationsRef = React.useRef<HTMLDivElement>(null);
  
  // Função para rolar para uma seção específica
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Estado inicial do cliente
  const initialCustomerState: Customer = {
    id: '',
    tenantId: '',
    branchId: '',
    personType: PersonType.PF,
    name: '',
    tradeName: '',
    document: '',
    stateDocument: '',
    cityDocument: '',
    taxRegime: TaxRegime.SIMPLES,
    customerType: CustomerType.FINAL,
    status: CustomerStatus.ACTIVE,
    creditLimit: 0,
    paymentTerm: 0,
    website: '',
    observations: '',
    fiscalNotes: '',
    addresses: [
      {
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil',
        cityCode: '',
        stateCode: '',
        countryCode: '',
        addressType: 'Comercial',
        mainAddress: true,
        deliveryAddress: true
      }
    ],
    contacts: [
      {
        name: '',
        department: '',
        phone: '',
        mobilePhone: '',
        email: '',
        position: '',
        mainContact: true
      }
    ],
    lastPurchaseAt: undefined,
    createdAt: '',
    updatedAt: '',
    externalCode: '',
    salesmanId: '',
    priceTableId: '',
    paymentMethodId: '',
    suframa: '',
    referenceCode: ''
  };
  
  // Estados
  const [customer, setCustomer] = useState<Customer>(initialCustomerState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Efeito para carregar dados do cliente no modo de edição
  useEffect(() => {
    const fetchCustomer = async () => {
      if (isEditMode && id) {
        setFetchLoading(true);
        setFetchError(null);
        
        try {
          const data = await customerService.getCustomerById(id);
          setCustomer(data);
        } catch (error) {
          console.error('Erro ao carregar dados do cliente:', error);
          setFetchError('Não foi possível carregar os dados do cliente. Tente novamente mais tarde.');
        } finally {
          setFetchLoading(false);
        }
      }
    };
    
    fetchCustomer();
  }, [id, isEditMode]);
  
  // Manipulador para alterações nos campos do formulário
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    
    if (name.includes('.')) {
      // Campos aninhados (endereço ou contato)
      const parts = name.split('.');
      
      if (parts.length === 3) {
        // Array de objetos como endereços ou contatos: addresses.0.street
        const [parent, indexStr, field] = parts;
        const index = parseInt(indexStr);
        
        setCustomer(prev => {
          const parentArray = [...(prev[parent as keyof Customer] as any[])];
          parentArray[index] = {
            ...parentArray[index],
            [field]: type === 'checkbox' ? checked : value
          };
          
          return {
            ...prev,
            [parent]: parentArray
          };
        });
        
        // Limpar erros
        if (errors[parent as keyof FormErrors] && Array.isArray(errors[parent as keyof FormErrors])) {
          const errorArray = errors[parent as keyof FormErrors] as any[];
          if (errorArray[index] && errorArray[index][field as keyof typeof errorArray[0]]) {
            setErrors(prev => {
              const newErrorArr = [...(prev[parent as keyof FormErrors] as any[])];
              newErrorArr[index] = {
                ...newErrorArr[index],
                [field]: undefined
              };
              return {
                ...prev,
                [parent]: newErrorArr
              };
            });
          }
        }
      } else {
        // Objeto aninhado simples
        const [parent, field] = parts;
        setCustomer(prev => {
          const parentObj = prev[parent as keyof Customer] as Record<string, any> || {};
          
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [field]: value
            }
          };
        });
        
        // Limpar erros
        if (errors[parent as keyof FormErrors] && 
           (errors[parent as keyof FormErrors] as Record<string, any>)[field]) {
          setErrors(prev => {
            const parentErrors = prev[parent as keyof FormErrors] as Record<string, any>;
            return {
              ...prev,
              [parent]: {
                ...parentErrors,
                [field]: undefined
              }
            };
          });
        }
      }
    } else if (name === 'document') {
      // Formatar CPF/CNPJ
      const formattedDocument = formatCNPJ(value);
      setCustomer(prev => ({
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
    } else if (type === 'checkbox') {
      // Campos de checkbox
      setCustomer(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'creditLimit' || name === 'paymentTerm') {
      // Campos numéricos
      setCustomer(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
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
      setCustomer(prev => ({
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

  // Manipulador para adicionar endereço
  const handleAddAddress = () => {
    setCustomer(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          street: '',
          number: '',
          complement: '',
          district: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Brasil',
          cityCode: '',
          stateCode: '',
          countryCode: '',
          addressType: 'Comercial',
          mainAddress: false,
          deliveryAddress: false
        }
      ]
    }));
  };
  
  // Manipulador para remover endereço
  const handleRemoveAddress = (index: number) => {
    setCustomer(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };
  
  // Manipulador para adicionar contato
  const handleAddContact = () => {
    setCustomer(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: '',
          department: '',
          phone: '',
          mobilePhone: '',
          email: '',
          position: '',
          mainContact: false
        }
      ]
    }));
  };
  
  // Manipulador para remover contato
  const handleRemoveContact = (index: number) => {
    setCustomer(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Validar nome
    if (!customer.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }
    
    // Validar tipo de pessoa
    if (!customer.personType) {
      newErrors.personType = 'Tipo de pessoa é obrigatório';
      isValid = false;
    }
    
    // Validar CPF/CNPJ
    if (!customer.document.trim()) {
      newErrors.document = 'Documento é obrigatório';
      isValid = false;
    } else if (!validateCNPJ(cleanCNPJ(customer.document))) {
      newErrors.document = customer.personType === PersonType.PF ? 'CPF inválido' : 'CNPJ inválido';
      isValid = false;
    }
    
    // Validar tipo de cliente
    if (!customer.customerType) {
      newErrors.customerType = 'Tipo de cliente é obrigatório';
      isValid = false;
    }

    // Validar regime tributário (apenas para PJ)
    if (customer.personType === PersonType.PJ && !customer.taxRegime) {
      newErrors.taxRegime = 'Regime tributário é obrigatório';
      isValid = false;
    }
    
    // Validar campos de endereço (apenas o primeiro endereço é obrigatório)
    if (customer.addresses.length > 0) {
      const addressErrors = customer.addresses.map(address => {
        const addrErr: Record<string, string> = {};
        let hasErrors = false;
        
        if (!address.street.trim()) {
          addrErr.street = 'Rua é obrigatória';
          hasErrors = true;
        }
        
        if (!address.number.trim()) {
          addrErr.number = 'Número é obrigatório';
          hasErrors = true;
        }
        
        if (!address.district.trim()) {
          addrErr.district = 'Bairro é obrigatório';
          hasErrors = true;
        }
        
        if (!address.city.trim()) {
          addrErr.city = 'Cidade é obrigatória';
          hasErrors = true;
        }
        
        if (!address.state.trim()) {
          addrErr.state = 'Estado é obrigatório';
          hasErrors = true;
        }
        
        if (!address.zipCode.trim()) {
          addrErr.zipCode = 'CEP é obrigatório';
          hasErrors = true;
        }
        
        if (hasErrors) {
          isValid = false;
          return addrErr;
        }
        
        return {};
      });
      
      if (addressErrors.some(err => Object.keys(err).length > 0)) {
        newErrors.addresses = addressErrors;
      }
    }
    
    // Validar campos de contato (apenas o primeiro contato é obrigatório)
    if (customer.contacts.length > 0) {
      const contactErrors = customer.contacts.map((contact, index) => {
        const contactErr: Record<string, string> = {};
        let hasErrors = false;
        
        // Apenas o primeiro contato é obrigatório
        if (index === 0) {
          if (!contact.name.trim()) {
            contactErr.name = 'Nome é obrigatório';
            hasErrors = true;
          }
          
          if ((!contact.phone || !contact.phone.trim()) && (!contact.mobilePhone || !contact.mobilePhone.trim())) {
            contactErr.phone = 'Pelo menos um telefone é obrigatório';
            hasErrors = true;
          }
          
          if (contact.email && contact.email.trim() !== '' && !/\S+@\S+\.\S+/.test(contact.email)) {
            contactErr.email = 'Email inválido';
            hasErrors = true;
          }
        } else if (contact.email && contact.email.trim() !== '' && !/\S+@\S+\.\S+/.test(contact.email)) {
          contactErr.email = 'Email inválido';
          hasErrors = true;
        }
        
        if (hasErrors) {
          isValid = false;
          return contactErr;
        }
        
        return {};
      });
      
      if (contactErrors.some(err => Object.keys(err).length > 0)) {
        newErrors.contacts = contactErrors;
      }
    }
    
    // Validar website
    if (customer.website && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?].*)?$/.test(customer.website)) {
      newErrors.website = 'Website inválido';
      isValid = false;
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
        await customerService.updateCustomer(id, customer);
        enqueueSnackbar('Cliente atualizado com sucesso!', { variant: 'success' });
      } else {
        // Modo de criação
        await customerService.createCustomer(customer);
        enqueueSnackbar('Cliente criado com sucesso!', { variant: 'success' });
      }
      
      // Redirecionar para a lista de clientes
      navigate('/customers');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      enqueueSnackbar('Erro ao salvar cliente. Tente novamente.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Manipulador para cancelar
  const handleCancel = () => {
    navigate('/customers');
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
              <Button color="inherit" size="small" onClick={() => navigate('/customers')}>
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
      <Container maxWidth="lg">
      
        {fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : fetchError ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {fetchError}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {viewOnly ? "Visualizar Cliente" : isEditMode ? "Editar Cliente" : "Novo Cliente"}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Breadcrumbs aria-label="breadcrumb">
                <Link component={RouterLink} to="/dashboard" color="inherit">
                  Dashboard
                </Link>
                <Link component={RouterLink} to="/customers" color="inherit">
                  Clientes
                </Link>
                <Typography color="text.primary">
                  {viewOnly ? 'Visualizar' : (isEditMode ? 'Editar' : 'Novo')}
                </Typography>
              </Breadcrumbs>
            </Box>
            
            <Grid container spacing={2}>
              {/* Menu de navegação lateral */}
              <Grid item xs={12} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    borderRadius: 2,
                    boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                    position: { md: 'sticky' },
                    top: { md: 16 },
                    mb: { xs: 2, md: 0 }
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <List component="nav">
                      <ListItemButton onClick={() => scrollToSection(basicInfoRef)}>
                        <ListItemIcon>
                          <PersonIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Informações Básicas" />
                      </ListItemButton>
                      <ListItemButton onClick={() => scrollToSection(addressesRef)}>
                        <ListItemIcon>
                          <LocationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Endereços" />
                      </ListItemButton>
                      <ListItemButton onClick={() => scrollToSection(contactsRef)}>
                        <ListItemIcon>
                          <ContactPhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Contatos" />
                      </ListItemButton>
                      <ListItemButton onClick={() => scrollToSection(financialRef)}>
                        <ListItemIcon>
                          <MoneyIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Financeiro" />
                      </ListItemButton>
                      <ListItemButton onClick={() => scrollToSection(observationsRef)}>
                        <ListItemIcon>
                          <DescriptionIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Observações" />
                      </ListItemButton>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Formulário */}
              <Grid item xs={12} md={9}>
                <Box component="form" onSubmit={handleSubmit}>
                  <div ref={basicInfoRef}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        borderRadius: 2,
                        boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                        overflow: 'hidden',
                        mb: 3
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
                          <PersonIcon fontSize="small" color="primary" />
                          Informações Básicas
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={2}>
                            <TextField
                              select
                              fullWidth
                              label="Tipo de Pessoa"
                              name="personType"
                              value={customer.personType}
                              onChange={handleChange}
                              error={!!errors.personType}
                              helperText={errors.personType}
                              required
                              variant="outlined"
                              InputProps={{ readOnly: viewOnly }}
                            >
                              <MenuItem value={PersonType.PF}>Pessoa Física</MenuItem>
                              <MenuItem value={PersonType.PJ}>Pessoa Jurídica</MenuItem>
                            </TextField>
                          </Grid>
                          
                          <Grid item xs={12} md={customer.personType === PersonType.PF ? 6 : 5}>
                            <TextField
                              fullWidth
                              label={customer.personType === PersonType.PF ? "Nome Completo" : "Razão Social"}
                              name="name"
                              value={customer.name}
                              onChange={handleChange}
                              error={!!errors.name}
                              helperText={errors.name}
                              required
                              variant="outlined"
                              placeholder={customer.personType === PersonType.PF ? "Ex: João da Silva" : "Ex: Empresa XYZ Ltda"}
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                          
                          {customer.personType === PersonType.PJ && (
                            <Grid item xs={12} md={5}>
                              <TextField
                                fullWidth
                                label="Nome Fantasia"
                                name="tradeName"
                                value={customer.tradeName}
                                onChange={handleChange}
                                variant="outlined"
                                placeholder="Ex: XYZ Comércio"
                                InputProps={{ readOnly: viewOnly }}
                              />
                            </Grid>
                          )}
                          
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label={customer.personType === PersonType.PF ? "CPF" : "CNPJ"}
                              name="document"
                              value={customer.document}
                              onChange={handleChange}
                              error={!!errors.document}
                              helperText={errors.document}
                              required
                              variant="outlined"
                              placeholder={customer.personType === PersonType.PF ? "000.000.000-00" : "00.000.000/0000-00"}
                              inputProps={{ maxLength: customer.personType === PersonType.PF ? 14 : 18, readOnly: viewOnly }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <TextField
                              select
                              fullWidth
                              label="Tipo de Cliente"
                              name="customerType"
                              value={customer.customerType}
                              onChange={handleChange}
                              error={!!errors.customerType}
                              helperText={errors.customerType}
                              required
                              variant="outlined"
                              InputProps={{ readOnly: viewOnly }}
                            >
                              <MenuItem value={CustomerType.FINAL}>Consumidor Final</MenuItem>
                              <MenuItem value={CustomerType.RESELLER}>Revendedor</MenuItem>
                              <MenuItem value={CustomerType.WHOLESALE}>Atacadista</MenuItem>
                            </TextField>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <TextField
                              select
                              fullWidth
                              label="Status"
                              name="status"
                              value={customer.status}
                              onChange={handleChange}
                              variant="outlined"
                              InputProps={{ readOnly: viewOnly }}
                            >
                              <MenuItem value={CustomerStatus.ACTIVE}>Ativo</MenuItem>
                              <MenuItem value={CustomerStatus.INACTIVE}>Inativo</MenuItem>
                              <MenuItem value={CustomerStatus.BLOCKED}>Bloqueado</MenuItem>
                            </TextField>
                          </Grid>
                          
                          {customer.personType === PersonType.PJ && (
                            <>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  fullWidth
                                  label="Inscrição Estadual"
                                  name="stateDocument"
                                  value={customer.stateDocument}
                                  onChange={handleChange}
                                  error={!!errors.stateDocument}
                                  helperText={errors.stateDocument}
                                  variant="outlined"
                                  placeholder="Ex: 123456789"
                                  InputProps={{ readOnly: viewOnly }}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <TextField
                                  fullWidth
                                  label="Inscrição Municipal"
                                  name="cityDocument"
                                  value={customer.cityDocument}
                                  onChange={handleChange}
                                  error={!!errors.cityDocument}
                                  helperText={errors.cityDocument}
                                  variant="outlined"
                                  placeholder="Ex: 123456789"
                                  InputProps={{ readOnly: viewOnly }}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <TextField
                                  select
                                  fullWidth
                                  label="Regime Tributário"
                                  name="taxRegime"
                                  value={customer.taxRegime}
                                  onChange={handleChange}
                                  error={!!errors.taxRegime}
                                  helperText={errors.taxRegime}
                                  required
                                  variant="outlined"
                                  InputProps={{ readOnly: viewOnly }}
                                >
                                  <MenuItem value={TaxRegime.SIMPLES}>Simples Nacional</MenuItem>
                                  <MenuItem value={TaxRegime.MEI}>Microempreendedor Individual</MenuItem>
                                  <MenuItem value={TaxRegime.PRESUMIDO}>Lucro Presumido</MenuItem>
                                  <MenuItem value={TaxRegime.REAL}>Lucro Real</MenuItem>
                                </TextField>
                              </Grid>
                            </>
                          )}
                          
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Website"
                              name="website"
                              value={customer.website}
                              onChange={handleChange}
                              error={!!errors.website}
                              helperText={errors.website}
                              variant="outlined"
                              placeholder="https://www.exemplo.com.br"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div ref={addressesRef}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        borderRadius: 2,
                        boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                        overflow: 'hidden',
                        mb: 3
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
                          Endereços
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {customer.addresses.map((address, index) => (
                            <Grid item xs={12} key={index}>
                              <Card
                                elevation={0}
                                sx={{
                                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                                  borderRadius: 2,
                                  boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                                  overflow: 'hidden',
                                  mb: 2
                                }}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        color: theme.palette.text.primary,
                                        fontWeight: 600
                                      }}
                                    >
                                      <HomeIcon fontSize="small" color="primary" />
                                      Endereço {index + 1}
                                    </Typography>
                                    
                                    {index > 0 && (
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveAddress(index)}
                                        disabled={viewOnly}
                                      >
                                        Remover
                                      </Button>
                                    )}
                                  </Box>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                      <TextField
                                        fullWidth
                                        label="Rua"
                                        name={`addresses.${index}.street`}
                                        value={address.street}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.street}
                                        helperText={errors.addresses && errors.addresses[index]?.street}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        label="Número"
                                        name={`addresses.${index}.number`}
                                        value={address.number}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.number}
                                        helperText={errors.addresses && errors.addresses[index]?.number}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        fullWidth
                                        label="Complemento"
                                        name={`addresses.${index}.complement`}
                                        value={address.complement}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.complement}
                                        helperText={errors.addresses && errors.addresses[index]?.complement}
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        fullWidth
                                        label="Bairro"
                                        name={`addresses.${index}.district`}
                                        value={address.district}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.district}
                                        helperText={errors.addresses && errors.addresses[index]?.district}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        label="Cidade"
                                        name={`addresses.${index}.city`}
                                        value={address.city}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.city}
                                        helperText={errors.addresses && errors.addresses[index]?.city}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        label="Estado"
                                        name={`addresses.${index}.state`}
                                        value={address.state}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.state}
                                        helperText={errors.addresses && errors.addresses[index]?.state}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        fullWidth
                                        label="CEP"
                                        name={`addresses.${index}.zipCode`}
                                        value={address.zipCode}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.zipCode}
                                        helperText={errors.addresses && errors.addresses[index]?.zipCode}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={2}>
                                      <TextField
                                        fullWidth
                                        label="País"
                                        name={`addresses.${index}.country`}
                                        value={address.country}
                                        onChange={handleChange}
                                        error={!!errors.addresses && !!errors.addresses[index]?.country}
                                        helperText={errors.addresses && errors.addresses[index]?.country}
                                        required
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        select
                                        fullWidth
                                        label="Tipo de Endereço"
                                        name={`addresses.${index}.addressType`}
                                        value={address.addressType}
                                        onChange={handleChange}
                                        variant="outlined"
                                        InputProps={{ readOnly: viewOnly }}
                                      >
                                        <MenuItem value="Comercial">Comercial</MenuItem>
                                        <MenuItem value="Residencial">Residencial</MenuItem>
                                        <MenuItem value="Entrega">Entrega</MenuItem>
                                        <MenuItem value="Faturamento">Faturamento</MenuItem>
                                      </TextField>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={address.mainAddress}
                                            onChange={handleChange}
                                            name={`addresses.${index}.mainAddress`}
                                            color="primary"
                                            disabled={viewOnly}
                                          />
                                        }
                                        label="Endereço Principal"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={address.deliveryAddress}
                                            onChange={handleChange}
                                            name={`addresses.${index}.deliveryAddress`}
                                            color="primary"
                                            disabled={viewOnly}
                                          />
                                        }
                                        label="Endereço de Entrega"
                                      />
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                          
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddAddress}
                                disabled={viewOnly}
                              >
                                Adicionar Endereço
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div ref={contactsRef}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        borderRadius: 2,
                        boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                        overflow: 'hidden',
                        mb: 3
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
                          <ContactPhoneIcon fontSize="small" color="primary" />
                          Contatos
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {customer.contacts.map((contact, index) => (
                            <Grid item xs={12} key={index}>
                              <Card
                                elevation={0}
                                sx={{
                                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                                  borderRadius: 2,
                                  boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                                  overflow: 'hidden',
                                  mb: 2
                                }}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        color: theme.palette.text.primary,
                                        fontWeight: 600
                                      }}
                                    >
                                      <ContactPhoneIcon fontSize="small" color="primary" />
                                      Contato {index + 1}
                                    </Typography>
                                    
                                    {index > 0 && (
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveContact(index)}
                                        disabled={viewOnly}
                                      >
                                        Remover
                                      </Button>
                                    )}
                                  </Box>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Nome do Contato"
                                        name={`contacts.${index}.name`}
                                        value={contact.name}
                                        onChange={handleChange}
                                        error={!!errors.contacts && !!errors.contacts[index]?.name}
                                        helperText={errors.contacts && errors.contacts[index]?.name}
                                        required={index === 0}
                                        variant="outlined"
                                        placeholder="Ex: João da Silva"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Cargo"
                                        name={`contacts.${index}.position`}
                                        value={contact.position}
                                        onChange={handleChange}
                                        variant="outlined"
                                        placeholder="Ex: Gerente Financeiro"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={4}>
                                      <TextField
                                        fullWidth
                                        label="Telefone"
                                        name={`contacts.${index}.phone`}
                                        value={contact.phone || ''}
                                        onChange={handleChange}
                                        error={!!errors.contacts && !!errors.contacts[index]?.phone}
                                        helperText={errors.contacts && errors.contacts[index]?.phone}
                                        required={index === 0}
                                        variant="outlined"
                                        placeholder="(00) 0000-0000"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <TextField
                                        fullWidth
                                        label="Celular"
                                        name={`contacts.${index}.mobilePhone`}
                                        value={contact.mobilePhone || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                        placeholder="(00) 00000-0000"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <TextField
                                        fullWidth
                                        label="Email"
                                        name={`contacts.${index}.email`}
                                        value={contact.email || ''}
                                        onChange={handleChange}
                                        error={!!errors.contacts && !!errors.contacts[index]?.email}
                                        helperText={errors.contacts && errors.contacts[index]?.email}
                                        variant="outlined"
                                        placeholder="contato@exemplo.com"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Departamento"
                                        name={`contacts.${index}.department`}
                                        value={contact.department || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                        placeholder="Ex: Financeiro"
                                        InputProps={{ readOnly: viewOnly }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={contact.mainContact}
                                            onChange={handleChange}
                                            name={`contacts.${index}.mainContact`}
                                            color="primary"
                                            disabled={viewOnly}
                                          />
                                        }
                                        label="Contato Principal"
                                      />
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                          
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddContact}
                                disabled={viewOnly}
                              >
                                Adicionar Contato
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div ref={financialRef}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        borderRadius: 2,
                        boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                        overflow: 'hidden',
                        mb: 3
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
                          <MoneyIcon fontSize="small" color="primary" />
                          Informações Financeiras
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Limite de Crédito (R$)"
                              name="creditLimit"
                              type="number"
                              value={customer.creditLimit}
                              onChange={handleChange}
                              error={!!errors.creditLimit}
                              helperText={errors.creditLimit}
                              variant="outlined"
                              inputProps={{ min: 0, step: 0.01, readOnly: viewOnly }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Prazo de Pagamento (dias)"
                              name="paymentTerm"
                              type="number"
                              value={customer.paymentTerm}
                              onChange={handleChange}
                              error={!!errors.paymentTerm}
                              helperText={errors.paymentTerm}
                              variant="outlined"
                              inputProps={{ min: 0, step: 1, readOnly: viewOnly }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Forma de Pagamento"
                              name="paymentMethodId"
                              value={customer.paymentMethodId}
                              onChange={handleChange}
                              variant="outlined"
                              placeholder="Selecione a forma de pagamento preferencial"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Vendedor Responsável"
                              name="salesmanId"
                              value={customer.salesmanId}
                              onChange={handleChange}
                              variant="outlined"
                              placeholder="Selecione o vendedor responsável"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Tabela de Preços"
                              name="priceTableId"
                              value={customer.priceTableId}
                              onChange={handleChange}
                              variant="outlined"
                              placeholder="Selecione a tabela de preços"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div ref={observationsRef}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        borderRadius: 2,
                        boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
                        overflow: 'hidden',
                        mb: 3
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
                          <DescriptionIcon fontSize="small" color="primary" />
                          Observações
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Observações Gerais"
                              name="observations"
                              value={customer.observations}
                              onChange={handleChange}
                              multiline
                              rows={4}
                              variant="outlined"
                              placeholder="Informações adicionais sobre o cliente"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Observações para Nota Fiscal"
                              name="fiscalNotes"
                              value={customer.fiscalNotes}
                              onChange={handleChange}
                              multiline
                              rows={4}
                              variant="outlined"
                              placeholder="Informações que devem aparecer nas notas fiscais"
                              InputProps={{ readOnly: viewOnly }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Botões */}
                  {!viewOnly && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
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
                  )}
                  
                  {viewOnly && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleCancel}
                        startIcon={<ChevronLeftIcon />}
                      >
                        Voltar
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        component={RouterLink}
                        to={`/customers/edit/${id}`}
                        startIcon={<EditIcon />}
                        sx={{
                          fontWeight: 600,
                          boxShadow: 2,
                          borderRadius: 2,
                          px: 3,
                          py: 1.2
                        }}
                      >
                        Editar
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
};

export default CustomerFormPage; 