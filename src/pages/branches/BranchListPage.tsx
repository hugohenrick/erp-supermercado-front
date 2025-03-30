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
  Business as BusinessIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Branch, BranchStatus, BranchType, branchService } from '../../services/api';
import { useSnackbar } from 'notistack';
import DeleteConfirmDialog from '../../components/common/DeleteConfirmDialog';
import { formatFullAddress, formatBranchType, formatBranchStatus } from '../../utils/formatUtils';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBranch } from '../../context/BranchContext';
import useBranchChangeRefresh from '../../hooks/useBranchChangeRefresh';

const BranchListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { refreshBranches, setActiveBranch, activeBranch } = useBranch();
  
  // Estados
  const [branches, setBranches] = useState<Branch[]>([]);
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  
  // Estado para verificação de tenant-id
  const [tenantIdMissing, setTenantIdMissing] = useState<boolean>(false);
  const [manualTenantId, setManualTenantId] = useState<string>('');
  
  // Verificar tenant-id ao carregar o componente
  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId');
    console.log('BranchListPage: Verificando tenant-id no localStorage:', tenantId);
    
    if (!tenantId) {
      console.warn('BranchListPage: Tenant ID não encontrado. Exibindo formulário de configuração.');
      setTenantIdMissing(true);
      setError('Tenant ID não encontrado. Por favor, configure um ID de tenant para continuar.');
    } else {
      console.log('BranchListPage: Tenant ID encontrado:', tenantId);
      setTenantIdMissing(false);
    }
  }, []);
  
  // Função para definir manualmente um tenant-id
  const handleSetTenantId = () => {
    if (manualTenantId.trim()) {
      console.log('BranchListPage: Configurando tenant-id manualmente:', manualTenantId.trim());
      localStorage.setItem('tenantId', manualTenantId.trim());
      setTenantIdMissing(false);
      setError(null);
      
      // Forçar uma atualização do localStorage
      window.dispatchEvent(new Event('storage'));
      
      // Disparar evento personalizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('tenant-id-updated'));
      
      enqueueSnackbar('Tenant ID configurado com sucesso!', { variant: 'success' });
      
      // Recarregar as filiais após um pequeno delay para garantir que os interceptors foram atualizados
      setTimeout(() => {
        fetchBranches();
      }, 500);
    } else {
      enqueueSnackbar('Por favor, informe um Tenant ID válido!', { variant: 'error' });
    }
  };
  
  // Função para carregar as filiais
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await branchService.getBranches(page, rowsPerPage, debouncedSearchTerm);
      setBranches(result.content);
      setTotalItems(result.totalElements);
      
      // Removemos a chamada para refreshBranches aqui para evitar o loop infinito
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
      setError('Não foi possível carregar as filiais. Tente novamente mais tarde.');
      setBranches([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm]); // Removemos refreshBranches das dependências
  
  // Use our custom hook to automatically refresh data when branch changes
  // Usamos o custom hook para gerenciar a atualização automática quando a filial muda
  const { loading: branchChangeLoading, refresh: branchChangeRefresh } = useBranchChangeRefresh(fetchBranches, [page, rowsPerPage, debouncedSearchTerm], setPage);
  
  // Efeito para carregar filiais quando a página é carregada ou quando os parâmetros mudam
  // Removemos esse useEffect duplicado que causava chamadas redundantes
  // fetchBranches já está sendo chamado pelo useBranchChangeRefresh
  
  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Resetar para a primeira página ao buscar
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Atualizar o loading state baseado no custom hook
  useEffect(() => {
    setLoading(branchChangeLoading);
  }, [branchChangeLoading]);
  
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
  
  // handleRefresh agora usa o refresh do custom hook
  const handleRefresh = () => {
    branchChangeRefresh();
  };
  
  const handleAddBranch = () => {
    navigate('/branches/new');
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, branchId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedBranchId(branchId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBranchId(null);
  };
  
  const handleEditBranch = (id: string) => {
    handleMenuClose();
    navigate(`/branches/edit/${id}`);
  };
  
  const handleViewBranch = (id: string) => {
    handleMenuClose();
    // Navegar para detalhes da filial
    navigate(`/branches/view/${id}`);
  };
  
  const handleToggleBranchStatus = async (id: string, currentStatus: BranchStatus) => {
    handleMenuClose();
    
    const newStatus = currentStatus === BranchStatus.ACTIVE ? BranchStatus.INACTIVE : BranchStatus.ACTIVE;
    const action = newStatus === BranchStatus.ACTIVE ? 'ativar' : 'desativar';
    
    try {
      await branchService.changeBranchStatus(id, newStatus);
      
      // Atualizar a lista localmente
      const updatedBranches = branches.map(branch => 
        branch.id === id ? { ...branch, status: newStatus } : branch
      );
      setBranches(updatedBranches);
      
      // Se a filial que mudou de status é a ativa, atualize-a no contexto global
      if (activeBranch?.id === id) {
        const updatedBranch = updatedBranches.find(b => b.id === id);
        if (updatedBranch) {
          setActiveBranch(updatedBranch);
        }
      }
      
      // Atualizamos apenas o contexto global aqui, sem disparar uma busca completa
      // A atualização do contexto já está refletida localmente nos branches
      
      enqueueSnackbar(`Filial ${action}da com sucesso!`, { variant: 'success' });
    } catch (error) {
      console.error(`Erro ao ${action} filial:`, error);
      enqueueSnackbar(`Erro ao ${action} filial. Tente novamente.`, { variant: 'error' });
    }
  };
  
  const handleDeleteClick = (branchId: string) => {
    handleMenuClose();
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setBranchToDelete(branch);
      setDeleteDialogOpen(true);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    
    try {
      await branchService.deleteBranch(branchToDelete.id!);
      
      // Atualizar a lista localmente
      setBranches(prev => prev.filter(branch => branch.id !== branchToDelete.id));
      setTotalItems(prev => prev - 1);
      
      // Se a filial excluída era a ativa, precisamos selecionar outra
      if (activeBranch?.id === branchToDelete.id) {
        // Selecionar outra filial da lista local para ser a ativa
        const remainingBranches = branches.filter(branch => branch.id !== branchToDelete.id);
        if (remainingBranches.length > 0) {
          // Preferir a filial principal, se existir
          const mainBranch = remainingBranches.find(branch => branch.isMain);
          setActiveBranch(mainBranch || remainingBranches[0]);
        } else {
          // Se não houver mais filiais, precisamos recarregar a lista completa
          refreshBranches();
        }
      }
      
      enqueueSnackbar('Filial excluída com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao excluir filial:', error);
      enqueueSnackbar('Erro ao excluir filial. Tente novamente.', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setBranchToDelete(null);
  };
  
  // Adicionar função para definir a filial como ativa
  const handleSetActiveClick = (branchId: string) => {
    handleMenuClose();
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setActiveBranch(branch);
      enqueueSnackbar(`${branch.name} definida como filial ativa`, { variant: 'success' });
    }
  };
  
  // Função para filtrar branches localmente (caso não haja filtro no backend)
  const filteredBranches = searchTerm && branches && branches.length > 0
    ? branches.filter(branch => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.document.includes(searchTerm) ||
        branch.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : branches || [];
  
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
              Para visualizar as filiais, é necessário configurar um Tenant ID. Este é um identificador único da sua empresa no sistema.
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
                  <BusinessIcon fontSize="large" color="primary" />
                  Filiais
                </Typography>
                
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/dashboard" color="inherit">
                    Dashboard
                  </Link>
                  <Typography color="text.primary">
                    Filiais
                  </Typography>
                </Breadcrumbs>
              </Grid>
              
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddBranch}
                  sx={{
                    fontWeight: 600,
                    boxShadow: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.2
                  }}
                >
                  Nova Filial
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
                placeholder="Buscar por nome, código ou documento..."
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
          
          {/* Tabela de filiais */}
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
            ) : filteredBranches.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'Nenhuma filial encontrada com os critérios informados.' : 'Nenhuma filial cadastrada.'}
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
                    onClick={handleAddBranch}
                    sx={{ mt: 2 }}
                  >
                    Adicionar Filial
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
                        <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Endereço</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Principal</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBranches.map((branch) => (
                        <TableRow
                          key={branch.id}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            ...(branch.status === BranchStatus.INACTIVE && {
                              bgcolor: alpha(theme.palette.text.disabled, 0.05),
                            })
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1" fontWeight={500}>
                                {branch.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {branch.document}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{branch.code}</TableCell>
                          <TableCell>
                            <Chip
                              label={formatBranchType(branch.type)}
                              size="small"
                              color={branch.type === BranchType.MAIN ? 'primary' : 'default'}
                              variant={branch.type === BranchType.MAIN ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2">
                                {formatFullAddress(branch.address, true)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {branch.address.city}, {branch.address.state}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatBranchStatus(branch.status || BranchStatus.ACTIVE)}
                              size="small"
                              color={
                                branch.status === BranchStatus.ACTIVE
                                  ? 'success'
                                  : branch.status === BranchStatus.INACTIVE
                                  ? 'error'
                                  : 'warning'
                              }
                              variant={branch.status === BranchStatus.ACTIVE ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {branch.isMain ? (
                              <Chip
                                label="Principal"
                                size="small"
                                color="primary"
                                variant="filled"
                                icon={<CheckIcon />}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Não
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Opções"
                              onClick={(e) => handleMenuOpen(e, branch.id!)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
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
        <MenuItem onClick={() => selectedBranchId && handleViewBranch(selectedBranchId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => selectedBranchId && handleEditBranch(selectedBranchId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {selectedBranchId && (
          <>
            <MenuItem 
              onClick={() => selectedBranchId && handleSetActiveClick(selectedBranchId)}
              sx={{ color: theme.palette.primary.main }}
              disabled={activeBranch?.id === selectedBranchId}
            >
              <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
              {activeBranch?.id === selectedBranchId ? 'Filial Ativa' : 'Definir como Ativa'}
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            {branches.find(b => b.id === selectedBranchId)?.status === BranchStatus.ACTIVE ? (
              <MenuItem
                onClick={() => 
                  selectedBranchId && 
                  handleToggleBranchStatus(selectedBranchId, BranchStatus.ACTIVE)
                }
                sx={{ color: theme.palette.error.main }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Desativar
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => 
                  selectedBranchId && 
                  handleToggleBranchStatus(selectedBranchId, BranchStatus.INACTIVE)
                }
                sx={{ color: theme.palette.success.main }}
              >
                <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                Ativar
              </MenuItem>
            )}
          </>
        )}
        <MenuItem 
          onClick={() => selectedBranchId && handleDeleteClick(selectedBranchId)}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Filial"
        content={
          branchToDelete
            ? `Tem certeza que deseja excluir a filial "${branchToDelete.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta filial? Esta ação não pode ser desfeita.'
        }
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default BranchListPage; 