import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Customer, CustomerStatus, PersonType, CustomerType, customerService } from '../../services/api';
import { useSnackbar } from 'notistack';
import DeleteConfirmDialog from '../../components/common/DeleteConfirmDialog';
import { formatPersonType, formatCustomerType, formatCustomerStatus, formatDate } from '../../utils/formatUtils';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCPF, formatCNPJ } from '../../utils/documentUtils';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginação
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  
  // Estados para menu de ações
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  // Estado para verificação de tenant-id
  const [tenantIdMissing, setTenantIdMissing] = useState<boolean>(false);
  const [manualTenantId, setManualTenantId] = useState<string>('');
  
  // Verificar tenant-id ao carregar o componente
  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId');
    console.log('CustomerListPage: Verificando tenant-id no localStorage:', tenantId);
    
    if (!tenantId) {
      console.warn('CustomerListPage: Tenant ID não encontrado. Exibindo formulário de configuração.');
      setTenantIdMissing(true);
      setError('Tenant ID não encontrado. Por favor, configure um ID de tenant para continuar.');
    } else {
      console.log('CustomerListPage: Tenant ID encontrado:', tenantId);
      setTenantIdMissing(false);
    }
  }, []);
  
  // Função para definir manualmente um tenant-id
  const handleSetTenantId = () => {
    if (manualTenantId.trim()) {
      console.log('CustomerListPage: Configurando tenant-id manualmente:', manualTenantId.trim());
      localStorage.setItem('tenantId', manualTenantId.trim());
      setTenantIdMissing(false);
      setError(null);
      
      // Forçar uma atualização do localStorage
      window.dispatchEvent(new Event('storage'));
      
      // Disparar evento personalizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      
      enqueueSnackbar('Tenant ID configurado com sucesso!', { variant: 'success' });
      
      // Recarregar os clientes após um pequeno delay para garantir que os interceptors foram atualizados
      setTimeout(() => {
        fetchCustomers();
      }, 500);
    } else {
      enqueueSnackbar('Por favor, informe um Tenant ID válido!', { variant: 'error' });
    }
  };
  
  // Função para formatar o documento (CPF/CNPJ)
  const formatDocument = (document: string, personType: PersonType): string => {
    if (personType === PersonType.PF) {
      return formatCPF(document);
    } else {
      return formatCNPJ(document);
    }
  };
  
  // Função para carregar os clientes
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await customerService.getCustomers(page, rowsPerPage, debouncedSearchTerm);
      setCustomers(result.content);
      setTotalItems(result.totalElements);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setError('Não foi possível carregar os clientes. Tente novamente mais tarde.');
      setCustomers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm]);
  
  // Efeito para carregar clientes quando a página é carregada ou quando os parâmetros mudam
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Resetar para a primeira página ao buscar
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Manipuladores de eventos
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleRefresh = () => {
    fetchCustomers();
  };
  
  const handleAddCustomer = () => {
    navigate('/customers/new');
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, customerId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomerId(customerId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomerId(null);
  };
  
  const handleEditCustomer = (id: string) => {
    handleMenuClose();
    navigate(`/customers/edit/${id}`);
  };
  
  const handleViewCustomer = (id: string) => {
    handleMenuClose();
    // Navegar para detalhes do cliente
    navigate(`/customers/view/${id}`);
  };
  
  const handleToggleCustomerStatus = async (id: string, currentStatus: CustomerStatus) => {
    handleMenuClose();
    
    const newStatus = currentStatus === CustomerStatus.ACTIVE 
      ? CustomerStatus.INACTIVE 
      : currentStatus === CustomerStatus.INACTIVE
        ? CustomerStatus.ACTIVE
        : CustomerStatus.ACTIVE; // Se estiver bloqueado, ativar
    
    const action = newStatus === CustomerStatus.ACTIVE 
      ? 'ativar' 
      : newStatus === CustomerStatus.INACTIVE 
        ? 'desativar' 
        : 'ativar';
    
    try {
      await customerService.changeCustomerStatus(id, newStatus);
      
      // Atualizar a lista localmente
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, status: newStatus } : customer
        )
      );
      
      enqueueSnackbar(`Cliente ${action}do com sucesso!`, { variant: 'success' });
    } catch (error) {
      console.error(`Erro ao ${action} cliente:`, error);
      enqueueSnackbar(`Erro ao ${action} cliente. Tente novamente.`, { variant: 'error' });
    }
  };
  
  const handleBlockCustomer = async (id: string) => {
    handleMenuClose();
    
    try {
      await customerService.changeCustomerStatus(id, CustomerStatus.BLOCKED);
      
      // Atualizar a lista localmente
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, status: CustomerStatus.BLOCKED } : customer
        )
      );
      
      enqueueSnackbar('Cliente bloqueado com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao bloquear cliente:', error);
      enqueueSnackbar('Erro ao bloquear cliente. Tente novamente.', { variant: 'error' });
    }
  };
  
  const handleDeleteClick = (customerId: string) => {
    handleMenuClose();
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomerToDelete(customer);
      setDeleteDialogOpen(true);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await customerService.deleteCustomer(customerToDelete.id!);
      
      // Atualizar a lista localmente
      setCustomers(prev => prev.filter(customer => customer.id !== customerToDelete.id));
      setTotalItems(prev => prev - 1);
      
      enqueueSnackbar('Cliente excluído com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      enqueueSnackbar('Erro ao excluir cliente. Tente novamente.', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };
  
  // Função para filtrar clientes localmente (caso não haja filtro no backend)
  const filteredCustomers = searchTerm && customers && customers.length > 0
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.tradeName && customer.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.document.includes(searchTerm) ||
        (customer.contacts && customer.contacts.some(contact => 
          contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : customers || [];
  
  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {tenantIdMissing ? (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.05)
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              Tenant ID não configurado
            </Typography>
            <Typography variant="body1" paragraph>
              Para visualizar os clientes, é necessário configurar um Tenant ID. Este é um identificador único da sua empresa no sistema.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Dica:</strong> O Tenant ID geralmente é fornecido durante o cadastro da sua empresa ou pode ser encontrado nas configurações da conta.
                Se você não souber seu Tenant ID, entre em contato com o administrador do sistema.
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
              <TextField
                label="Tenant ID"
                variant="outlined"
                size="small"
                value={manualTenantId}
                onChange={(e) => setManualTenantId(e.target.value)}
                fullWidth
                helperText="Informe o ID do seu tenant (empresa)"
                placeholder="ex: 123e4567-e89b-12d3-a456-426614174000"
                autoFocus
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSetTenantId}
                sx={{ height: 40 }}
              >
                Configurar
              </Button>
            </Box>
          </Card>
        ) : null}
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Cabeçalho */}
          <Box sx={{ mb: 4 }}>
            <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
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
                  <PersonIcon fontSize="large" color="primary" />
                  Clientes
                </Typography>
                
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/dashboard" color="inherit">
                    Dashboard
                  </Link>
                  <Typography color="text.primary">
                    Clientes
                  </Typography>
                </Breadcrumbs>
              </Grid>
              
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddCustomer}
                  sx={{
                    fontWeight: 600,
                    boxShadow: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.2
                  }}
                >
                  Novo Cliente
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {/* Barra de pesquisa e filtros */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
              boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                placeholder="Buscar por nome, razão social ou documento..."
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              
              <Tooltip title="Atualizar lista">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Card>
          
          {/* Mensagem de erro */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Tabela de clientes */}
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
              boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'Nenhum cliente encontrado com os critérios informados.' : 'Nenhum cliente cadastrado.'}
                </Typography>
                
                {searchTerm && (
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => setSearchTerm('')}
                    sx={{ mt: 2 }}
                  >
                    Limpar filtros
                  </Button>
                )}
                
                {!searchTerm && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddCustomer}
                    sx={{ mt: 2 }}
                  >
                    Adicionar Cliente
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 750 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Telefone</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Classificação</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCustomers.map((customer) => {
                        // Obter o primeiro contato (se existir) para exibir o telefone
                        const mainContact = customer.contacts && customer.contacts.length > 0
                          ? customer.contacts.find(c => c.mainContact) || customer.contacts[0]
                          : null;
                        
                        return (
                          <TableRow
                            key={customer.id}
                            hover
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              ...(customer.status === CustomerStatus.INACTIVE && {
                                bgcolor: alpha(theme.palette.text.disabled, 0.05),
                              }),
                              ...(customer.status === CustomerStatus.BLOCKED && {
                                bgcolor: alpha(theme.palette.warning.light, 0.05),
                              })
                            }}
                          >
                            <TableCell component="th" scope="row">
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body1" fontWeight={500}>
                                  {customer.name}
                                </Typography>
                                {customer.tradeName && (
                                  <Typography variant="caption" color="text.secondary">
                                    {customer.tradeName}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatPersonType(customer.personType)}
                                size="small"
                                color={customer.personType === PersonType.PJ ? 'primary' : 'default'}
                                variant={customer.personType === PersonType.PJ ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell>
                              {formatDocument(customer.document, customer.personType)}
                            </TableCell>
                            <TableCell>
                              {mainContact ? (mainContact.phone || mainContact.mobilePhone || '-') : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatCustomerType(customer.customerType)}
                                size="small"
                                color={
                                  customer.customerType === CustomerType.WHOLESALE 
                                    ? 'success'
                                    : customer.customerType === CustomerType.RESELLER 
                                      ? 'primary'
                                      : 'default'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatCustomerStatus(customer.status)}
                                size="small"
                                color={
                                  customer.status === CustomerStatus.ACTIVE
                                    ? 'success'
                                    : customer.status === CustomerStatus.INACTIVE
                                    ? 'error'
                                    : 'warning'
                                }
                                variant={customer.status === CustomerStatus.ACTIVE ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                aria-label="Opções"
                                onClick={(e) => handleMenuOpen(e, customer.id!)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Itens por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
          </Card>
        </motion.div>
      </Container>
      
      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        keepMounted
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <MenuItem onClick={() => selectedCustomerId && handleViewCustomer(selectedCustomerId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => selectedCustomerId && handleEditCustomer(selectedCustomerId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {selectedCustomerId && (
          <>
            {customers.find(c => c.id === selectedCustomerId)?.status === CustomerStatus.ACTIVE ? (
              <MenuItem
                onClick={() => 
                  selectedCustomerId && 
                  handleToggleCustomerStatus(selectedCustomerId, CustomerStatus.ACTIVE)
                }
                sx={{ color: theme.palette.error.main }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Desativar
              </MenuItem>
            ) : customers.find(c => c.id === selectedCustomerId)?.status === CustomerStatus.INACTIVE ? (
              <MenuItem
                onClick={() => 
                  selectedCustomerId && 
                  handleToggleCustomerStatus(selectedCustomerId, CustomerStatus.INACTIVE)
                }
                sx={{ color: theme.palette.success.main }}
              >
                <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                Ativar
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => 
                  selectedCustomerId && 
                  handleToggleCustomerStatus(selectedCustomerId, CustomerStatus.BLOCKED)
                }
                sx={{ color: theme.palette.success.main }}
              >
                <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                Desbloquear
              </MenuItem>
            )}
            
            {customers.find(c => c.id === selectedCustomerId)?.status !== CustomerStatus.BLOCKED && (
              <MenuItem
                onClick={() => selectedCustomerId && handleBlockCustomer(selectedCustomerId)}
                sx={{ color: theme.palette.warning.main }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Bloquear
              </MenuItem>
            )}
          </>
        )}
        <MenuItem 
          onClick={() => selectedCustomerId && handleDeleteClick(selectedCustomerId)}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Cliente"
        content={
          customerToDelete
            ? `Tem certeza que deseja excluir o cliente "${customerToDelete.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.'
        }
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default CustomerListPage; 