import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Grid,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Certificate, certificateService } from '../../services/certificateService';
import { useBranchChangeRefresh } from '../../hooks/useBranchChangeRefresh';
import { formatDate } from '../../utils/formatters';
import { useSnackbar } from 'notistack';
import DeleteConfirmDialog from '../../components/common/DeleteConfirmDialog';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBranch } from '../../context/BranchContext';

const CertificateListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { activeBranch } = useBranch();
  
  // Estados
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginação
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  
  // Estados para menu de ações
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  
  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  
  // Função para carregar os certificados
  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await certificateService.getCertificates(page, rowsPerPage);
      setCertificates(response.certificates);
      setTotalElements(response.total);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
      setError('Não foi possível carregar os certificados. Tente novamente mais tarde.');
      setCertificates([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);
  
  // Use our custom hook to automatically refresh data when branch changes
  useBranchChangeRefresh(fetchCertificates, [page, rowsPerPage], setPage);
  
  // Efeito para carregar certificados quando a página é carregada ou quando os parâmetros mudam
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);
  
  // Manipuladores de eventos
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleRefresh = () => {
    fetchCertificates();
  };
  
  const handleAddCertificate = () => {
    navigate('/certificates/new');
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, certificateId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCertificateId(certificateId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCertificateId(null);
  };
  
  const handleEditCertificate = (id: string) => {
    handleMenuClose();
    navigate(`/certificates/edit/${id}`);
  };
  
  const handleViewCertificate = (id: string) => {
    handleMenuClose();
    navigate(`/certificates/view/${id}`);
  };
  
  const handleToggleCertificateStatus = async (id: string, isActive: boolean) => {
    handleMenuClose();
    
    try {
      if (isActive) {
        await certificateService.deactivateCertificate(id);
      } else {
        await certificateService.activateCertificate(id);
      }
      
      // Atualizar a lista localmente
      setCertificates(prev =>
        prev.map(cert =>
          cert.id === id ? { ...cert, is_active: !isActive } : cert
        )
      );
      
      enqueueSnackbar(`Certificado ${isActive ? 'desativado' : 'ativado'} com sucesso!`, { variant: 'success' });
    } catch (error) {
      console.error(`Erro ao ${isActive ? 'desativar' : 'ativar'} certificado:`, error);
      enqueueSnackbar(`Erro ao ${isActive ? 'desativar' : 'ativar'} certificado. Tente novamente.`, { variant: 'error' });
    }
  };
  
  const handleDeleteClick = (certificateId: string) => {
    handleMenuClose();
    const certificate = certificates.find(c => c.id === certificateId);
    if (certificate) {
      setCertificateToDelete(certificate);
      setDeleteDialogOpen(true);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!certificateToDelete?.id) return;
    
    try {
      await certificateService.deleteCertificate(certificateToDelete.id);
      
      // Atualizar a lista localmente
      setCertificates(prev => prev.filter(cert => cert.id !== certificateToDelete.id));
      setTotalElements(prev => prev - 1);
      
      enqueueSnackbar('Certificado excluído com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao excluir certificado:', error);
      enqueueSnackbar('Erro ao excluir certificado. Tente novamente.', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setCertificateToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCertificateToDelete(null);
  };
  
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
                  <VerifiedUserIcon fontSize="large" color="primary" />
                  Certificados Digitais
                </Typography>
                
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/dashboard" color="inherit">
                    Dashboard
                  </Link>
                  <Link component={RouterLink} to="/branches" color="inherit">
                    Filiais
                  </Link>
                  <Typography color="text.primary">
                    Certificados
                  </Typography>
                </Breadcrumbs>
              </Grid>
              
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddCertificate}
                  sx={{
                    fontWeight: 600,
                    boxShadow: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.2
                  }}
                >
                  Novo Certificado
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {/* Mensagem de erro */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Tabela de certificados */}
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
            ) : certificates.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum certificado cadastrado.
                </Typography>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddCertificate}
                  sx={{ mt: 2 }}
                >
                  Adicionar Certificado
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 750 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Filial</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Validade</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {certificates.map((certificate) => (
                        <TableRow
                          key={certificate.id}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            ...(certificate.is_expired && {
                              bgcolor: alpha(theme.palette.error.main, 0.05),
                            })
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography variant="body1" fontWeight={500}>
                              {certificate.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{certificate.branch_name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {formatDate(certificate.expiration_date)}
                              {certificate.is_expired && (
                                <Tooltip title="Certificado expirado">
                                  <WarningIcon color="error" fontSize="small" />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={certificate.is_active ? 'Ativo' : 'Inativo'}
                              size="small"
                              color={certificate.is_active ? 'success' : 'default'}
                              variant={certificate.is_active ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Opções"
                              onClick={(e) => handleMenuOpen(e, certificate.id)}
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
        <MenuItem onClick={() => selectedCertificateId && handleViewCertificate(selectedCertificateId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => selectedCertificateId && handleEditCertificate(selectedCertificateId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {selectedCertificateId && (
          <>
            {certificates.find(c => c.id === selectedCertificateId)?.is_active ? (
              <MenuItem
                onClick={() => 
                  selectedCertificateId && 
                  handleToggleCertificateStatus(selectedCertificateId, true)
                }
                sx={{ color: theme.palette.error.main }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Desativar
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => 
                  selectedCertificateId && 
                  handleToggleCertificateStatus(selectedCertificateId, false)
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
          onClick={() => selectedCertificateId && handleDeleteClick(selectedCertificateId)}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Certificado"
        content={
          certificateToDelete
            ? `Tem certeza que deseja excluir o certificado "${certificateToDelete.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este certificado? Esta ação não pode ser desfeita.'
        }
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default CertificateListPage; 