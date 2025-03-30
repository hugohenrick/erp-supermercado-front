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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
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
  Lock as LockIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, UserRole, UserStatus } from '../../services/api';
import { userService } from '../../services/userService';
import { useBranchChangeRefresh } from '../../hooks/useBranchChangeRefresh';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import { useSnackbar } from 'notistack';
import DeleteConfirmDialog from '../../components/common/DeleteConfirmDialog';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBranch } from '../../context/BranchContext';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { activeBranch } = useBranch();
  
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginação
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  
  // Estados para menu de ações
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Estado para diálogo de alteração de senha
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  
  // Função para carregar os usuários
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeBranch) {
        const response = await userService.getUsers(page, rowsPerPage, debouncedSearchTerm);
        setUsers(response.users);
        setTotalElements(response.total);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Não foi possível carregar os usuários. Tente novamente mais tarde.');
      setUsers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, activeBranch]);
  
  // Use our custom hook to automatically refresh data when branch changes
  useBranchChangeRefresh(fetchUsers, [page, rowsPerPage, debouncedSearchTerm], setPage);
  
  // Efeito para carregar usuários quando a página é carregada ou quando os parâmetros mudam
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
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
    setPage(0);
  };
  
  const handleRefresh = () => {
    fetchUsers();
  };
  
  const handleAddUser = () => {
    navigate('/users/new');
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };
  
  const handleEditUser = (id: string) => {
    handleMenuClose();
    navigate(`/users/edit/${id}`);
  };
  
  const handleViewUser = (id: string) => {
    handleMenuClose();
    navigate(`/users/view/${id}`);
  };
  
  const handleToggleUserStatus = async (id: string, currentStatus: UserStatus) => {
    handleMenuClose();
    
    const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const action = newStatus === UserStatus.ACTIVE ? 'ativar' : 'desativar';
    
    try {
      await userService.updateStatus(id, newStatus);
      
      // Atualizar a lista localmente
      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...user, status: newStatus } : user
        )
      );
      
      enqueueSnackbar(`Usuário ${action}do com sucesso!`, { variant: 'success' });
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      enqueueSnackbar(`Erro ao ${action} usuário. Tente novamente.`, { variant: 'error' });
    }
  };
  
  const handleDeleteClick = (userId: string) => {
    handleMenuClose();
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) return;
    
    try {
      await userService.deleteUser(userToDelete.id);
      
      // Atualizar a lista localmente
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setTotalElements(prev => prev - 1);
      
      enqueueSnackbar('Usuário excluído com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      enqueueSnackbar('Erro ao excluir usuário. Tente novamente.', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  const handleChangePasswordClick = (userId: string) => {
    handleMenuClose();
    setSelectedUserId(userId);
    setPasswordDialogOpen(true);
  };
  
  const handleChangePassword = async () => {
    if (!selectedUserId || !newPassword) return;
    
    try {
      await userService.changePassword(selectedUserId, newPassword);
      enqueueSnackbar('Senha alterada com sucesso!', { variant: 'success' });
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      enqueueSnackbar('Erro ao alterar senha. Tente novamente.', { variant: 'error' });
    }
  };
  
  // Função para formatar o papel do usuário
  const formatRole = (role?: UserRole): string => {
    if (!role) return '';
    
    const roleMap: { [key in UserRole]: string } = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.MANAGER]: 'Gerente',
      [UserRole.EMPLOYEE]: 'Funcionário',
      [UserRole.CASHIER]: 'Caixa'
    };
    return roleMap[role] || role;
  };
  
  // Função para filtrar usuários localmente
  const filteredUsers = searchTerm && users && users.length > 0
    ? users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role ? formatRole(user.role).toLowerCase().includes(searchTerm.toLowerCase()) : false)
      )
    : users || [];
  
  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
                  Usuários
                </Typography>
                
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/dashboard" color="inherit">
                    Dashboard
                  </Link>
                  <Typography color="text.primary">
                    Usuários
                  </Typography>
                </Breadcrumbs>
              </Grid>
              
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddUser}
                  sx={{
                    fontWeight: 600,
                    boxShadow: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.2
                  }}
                >
                  Novo Usuário
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
                placeholder="Buscar por nome, email ou papel..."
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
          
          {/* Tabela de usuários */}
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
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'Nenhum usuário encontrado com os critérios informados.' : 'Nenhum usuário cadastrado.'}
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
                    onClick={handleAddUser}
                    sx={{ mt: 2 }}
                  >
                    Adicionar Usuário
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
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Papel</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Último Login</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            ...(user.status === UserStatus.INACTIVE && {
                              bgcolor: alpha(theme.palette.text.disabled, 0.05),
                            })
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography variant="body1" fontWeight={500}>
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role ? formatRole(user.role) : ''}
                              size="small"
                              color={
                                user.role === UserRole.ADMIN
                                  ? 'error'
                                  : user.role === UserRole.MANAGER
                                  ? 'warning'
                                  : 'default'
                              }
                              variant={user.role === UserRole.ADMIN || user.role === UserRole.MANAGER ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status === UserStatus.ACTIVE ? 'Ativo' : 'Inativo'}
                              size="small"
                              color={user.status === UserStatus.ACTIVE ? 'success' : 'error'}
                              variant={user.status === UserStatus.ACTIVE ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Opções"
                              onClick={(e) => handleMenuOpen(e, user.id!)}
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
                  count={totalElements}
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
        <MenuItem onClick={() => selectedUserId && handleViewUser(selectedUserId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => selectedUserId && handleEditUser(selectedUserId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => selectedUserId && handleChangePasswordClick(selectedUserId)}>
          <LockIcon fontSize="small" sx={{ mr: 1 }} />
          Alterar Senha
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {selectedUserId && (
          <>
            {users.find(u => u.id === selectedUserId)?.status === UserStatus.ACTIVE ? (
              <MenuItem
                onClick={() => 
                  selectedUserId && 
                  handleToggleUserStatus(selectedUserId, UserStatus.ACTIVE)
                }
                sx={{ color: theme.palette.error.main }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Desativar
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => 
                  selectedUserId && 
                  handleToggleUserStatus(selectedUserId, UserStatus.INACTIVE)
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
          onClick={() => selectedUserId && handleDeleteClick(selectedUserId)}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Usuário"
        content={
          userToDelete
            ? `Tem certeza que deseja excluir o usuário "${userToDelete.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.'
        }
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      
      {/* Diálogo de alteração de senha */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Digite a nova senha para o usuário {selectedUserId}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nova Senha"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleChangePassword} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserListPage; 