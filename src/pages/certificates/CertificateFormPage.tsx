import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedUserIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Certificate, certificateService } from '../../services/certificateService';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBranch } from '../../context/BranchContext';
import { Branch } from '../../services/api';
import { branchService } from '../../services/branchService';
import { formatDate } from '../../utils/formatters';

interface CertificateFormData {
  name: string;
  branch_id: string;
  password: string;
  expiration_date: string;
  file?: File | null;
  is_active?: boolean;
}

interface FormErrors {
  name?: string;
  branch_id?: string;
  password?: string;
  expiration_date?: string;
  file?: string;
}

interface CertificateFormPageProps {
  viewOnly?: boolean;
}

const CertificateFormPage: React.FC<CertificateFormPageProps> = ({ viewOnly = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const { activeBranch } = useBranch();
  
  // Estados
  const [formData, setFormData] = useState<CertificateFormData>({
    name: '',
    branch_id: '',
    password: '',
    expiration_date: '',
    file: null,
    is_active: true
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  
  // Carregar filiais
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await branchService.getBranches(0, 100);
        setBranches(response.content || []);
      } catch (error) {
        console.error('Erro ao carregar filiais:', error);
        enqueueSnackbar('Erro ao carregar filiais. Tente novamente.', { variant: 'error' });
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    
    fetchBranches();
  }, [enqueueSnackbar]);
  
  // Carregar certificado se estiver editando
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const cert = await certificateService.getCertificateById(id);
        setCertificate(cert);
        
        // Formatar a data de expiração para o formato esperado pelo input datetime-local
        let formattedExpirationDate = '';
        
        if (cert.expiration_date) {
          try {
            // Converter a data para objeto Date
            const expirationDate = new Date(cert.expiration_date);
            
            // Criar string no formato YYYY-MM-DDThh:mm
            const year = expirationDate.getFullYear();
            const month = String(expirationDate.getMonth() + 1).padStart(2, '0');
            const day = String(expirationDate.getDate()).padStart(2, '0');
            const hours = String(expirationDate.getHours()).padStart(2, '0');
            const minutes = String(expirationDate.getMinutes()).padStart(2, '0');
            
            formattedExpirationDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            console.log('Data original:', cert.expiration_date);
            console.log('Data formatada para o input:', formattedExpirationDate);
          } catch (error) {
            console.error('Erro ao formatar data de expiração:', error);
            // Em caso de erro, usar a data original
            formattedExpirationDate = cert.expiration_date;
          }
        }
        
        setFormData({
          name: cert.name || '',
          branch_id: cert.branch_id || '',
          password: cert.password || '',
          expiration_date: formattedExpirationDate,
          file: null,
          is_active: cert.is_active
        });
        
        console.log('Certificado carregado:', cert);
        console.log('FormData atualizado:', {
          name: cert.name,
          branch_id: cert.branch_id,
          expiration_date: formattedExpirationDate,
          is_active: cert.is_active
        });
      } catch (error) {
        console.error('Erro ao carregar certificado:', error);
        setError('Não foi possível carregar o certificado. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificate();
  }, [id, enqueueSnackbar]);
  
  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    if (!formData.branch_id) {
      newErrors.branch_id = 'A filial é obrigatória';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'A senha do certificado é obrigatória';
    }

    if (!formData.expiration_date) {
      newErrors.expiration_date = 'A data de expiração é obrigatória';
    }
    
    if (!id && !formData.file) {
      newErrors.file = 'O arquivo do certificado é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manipuladores de eventos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name, file.type, file.size);
      
      setFormData(prev => ({
        ...prev,
        file
      }));

      // Limpar erro do arquivo quando um novo for selecionado
      if (errors.file) {
        setErrors(prev => ({
          ...prev,
          file: undefined
        }));
      }

      // Se tiver senha, tenta extrair as informações do certificado
      if (formData.password) {
        try {
          const formDataToSend = new FormData();
          formDataToSend.append('certificate', file);
          formDataToSend.append('password', formData.password);

          // Log para debug
          console.log('Enviando arquivo:', file.name, file.type, file.size);
          console.log('Senha definida:', formData.password);

          // Verificar o conteúdo do FormData antes de enviar
          Array.from(formDataToSend.entries()).forEach(([key, value]) => {
            if (value instanceof File) {
              console.log('FormData -', key + ':', value.name, value.type, value.size);
            } else {
              console.log('FormData -', key + ':', value);
            }
          });

          const certInfo = await certificateService.extractCertificateInfo(formDataToSend);
          
          if (certInfo.expiration_date) {
            // Extrair o nome do subject (formato: CN=Nome,OU=...)
            const subjectName = certInfo.subject.split(',')[0].split('=')[1];
            
            // Formatar a data para o formato esperado pelo input datetime-local
            const expirationDate = new Date(certInfo.expiration_date);
            // Ajustar para o fuso horário local e garantir o formato correto
            const year = expirationDate.getFullYear();
            const month = String(expirationDate.getMonth() + 1).padStart(2, '0');
            const day = String(expirationDate.getDate()).padStart(2, '0');
            const hours = String(expirationDate.getHours()).padStart(2, '0');
            const minutes = String(expirationDate.getMinutes()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            console.log('Data original:', certInfo.expiration_date);
            console.log('Data formatada:', formattedDate);
            
            setFormData(prev => {
              console.log('Atualizando formData com nova data:', formattedDate);
              return {
                ...prev,
                expiration_date: formattedDate,
                name: subjectName
              };
            });
            
            enqueueSnackbar('Informações do certificado extraídas com sucesso!', { variant: 'success' });
          } else {
            enqueueSnackbar('Não foi possível extrair as informações do certificado.', { variant: 'warning' });
          }
        } catch (error: any) {
          console.error('Erro ao extrair informações do certificado:', error);
          enqueueSnackbar(error.message || 'Erro ao extrair informações do certificado', { variant: 'warning' });
        }
      } else {
        enqueueSnackbar('Digite a senha do certificado para carregar a data de validade automaticamente.', { variant: 'info' });
      }
    }
  };

  const handleTextFieldChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Se for o campo de senha e tiver um arquivo selecionado, tenta extrair as informações
    if (name === 'password' && value && formData.file) {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('certificate', formData.file);
        formDataToSend.append('password', value);

        // Log para debug
        console.log('Enviando arquivo:', formData.file.name, formData.file.type, formData.file.size);
        console.log('Nova senha:', value);

        // Verificar o conteúdo do FormData antes de enviar
        Array.from(formDataToSend.entries()).forEach(([key, value]) => {
          if (value instanceof File) {
            console.log('FormData -', key + ':', value.name, value.type, value.size);
          } else {
            console.log('FormData -', key + ':', value);
          }
        });

        const certInfo = await certificateService.extractCertificateInfo(formDataToSend);
        
        if (certInfo.expiration_date) {
          // Extrair o nome do subject (formato: CN=Nome,OU=...)
          const subjectName = certInfo.subject.split(',')[0].split('=')[1];
          
          // Formatar a data para o formato esperado pelo input datetime-local
          const expirationDate = new Date(certInfo.expiration_date);
          // Ajustar para o fuso horário local e garantir o formato correto
          const year = expirationDate.getFullYear();
          const month = String(expirationDate.getMonth() + 1).padStart(2, '0');
          const day = String(expirationDate.getDate()).padStart(2, '0');
          const hours = String(expirationDate.getHours()).padStart(2, '0');
          const minutes = String(expirationDate.getMinutes()).padStart(2, '0');
          
          const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
          
          console.log('Data original:', certInfo.expiration_date);
          console.log('Data formatada:', formattedDate);
          
          setFormData(prev => {
            console.log('Atualizando formData com nova data:', formattedDate);
            return {
              ...prev,
              expiration_date: formattedDate,
              name: subjectName
            };
          });
          
          enqueueSnackbar('Informações do certificado extraídas com sucesso!', { variant: 'success' });
        } else {
          enqueueSnackbar('Não foi possível extrair as informações do certificado.', { variant: 'warning' });
        }
      } catch (error: any) {
        console.error('Erro ao extrair informações do certificado:', error);
        enqueueSnackbar(error.message || 'Erro ao extrair informações do certificado', { variant: 'warning' });
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
    // Limpar erro do campo quando ele for alterado
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      file: null
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Por favor, corrija os erros no formulário.', { variant: 'error' });
      return;
    }
    
    setSaving(true);
    
    try {
      if (id) {
        // Atualizar certificado existente
        if (formData.file) {
          await certificateService.uploadCertificate(id, formData.file);
        }
        await certificateService.updateCertificate(id, {
          name: formData.name,
          branch_id: formData.branch_id,
          password: formData.password,
          expiration_date: formData.expiration_date,
          is_active: formData.is_active
        });
        enqueueSnackbar('Certificado atualizado com sucesso!', { variant: 'success' });
      } else {
        // Criar novo certificado
        if (!formData.file) {
          enqueueSnackbar('O arquivo do certificado é obrigatório.', { variant: 'error' });
          return;
        }

        console.log('Dados do formulário antes do envio:', {
          ...formData,
          file: formData.file ? {
            name: formData.file.name,
            type: formData.file.type,
            size: formData.file.size
          } : null
        });

        // Garantir que o nome do certificado seja o nome extraído do subject
        const certificateData = {
          name: formData.name,
          branch_id: formData.branch_id,
          password: formData.password,
          expiration_date: formData.expiration_date,
          file: formData.file,
          is_active: formData.is_active
        };

        console.log('Enviando certificado com dados:', certificateData);

        await certificateService.createCertificate(certificateData);
        enqueueSnackbar('Certificado criado com sucesso!', { variant: 'success' });
      }
      
      navigate('/certificates');
    } catch (error: any) {
      console.error('Erro ao salvar certificado:', error);
      if (error.response?.data?.message) {
        enqueueSnackbar(`Erro ao salvar certificado: ${error.response.data.message}`, { variant: 'error' });
      } else {
        enqueueSnackbar('Erro ao salvar certificado. Tente novamente.', { variant: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    navigate('/certificates');
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Voltar
          </Button>
        </Container>
      </DashboardLayout>
    );
  }
  
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
            <Grid container alignItems="center" spacing={2}>
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
                  {id ? 'Editar Certificado' : 'Novo Certificado'}
                </Typography>
                
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link component={RouterLink} to="/dashboard" color="inherit">
                    Dashboard
                  </Link>
                  <Link component={RouterLink} to="/branches" color="inherit">
                    Filiais
                  </Link>
                  <Link component={RouterLink} to="/certificates" color="inherit">
                    Certificados
                  </Link>
                  <Typography color="text.primary">
                    {id ? 'Editar' : 'Novo'}
                  </Typography>
                </Breadcrumbs>
              </Grid>
            </Grid>
          </Box>
          
          {/* Formulário */}
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
              boxShadow: `0 1px 3px 0 ${alpha(theme.palette.divider, 0.05)}`,
              overflow: 'hidden'
            }}
          >
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Certificado"
                    name="name"
                    value={formData.name}
                    onChange={handleTextFieldChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={saving || viewOnly}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.branch_id}>
                    <InputLabel>Filial</InputLabel>
                    <Select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleSelectChange}
                      label="Filial"
                      disabled={saving || viewOnly || loadingBranches}
                    >
                      {loadingBranches ? (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <span>Carregando filiais...</span>
                          </Box>
                        </MenuItem>
                      ) : branches.length === 0 ? (
                        <MenuItem disabled>
                          Nenhuma filial encontrada
                        </MenuItem>
                      ) : (
                        branches.map(branch => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.branch_id && (
                      <FormHelperText>{errors.branch_id}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Senha do Certificado"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleTextFieldChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={saving || viewOnly}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data de Validade"
                    name="expiration_date"
                    type="datetime-local"
                    value={formData.expiration_date || ''}
                    onChange={handleTextFieldChange}
                    error={Boolean(errors.expiration_date)}
                    helperText={errors.expiration_date || "A data de validade será extraída automaticamente do certificado"}
                    disabled={true}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        bgcolor: theme.palette.action.hover,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                        cursor: 'not-allowed'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Arquivo do Certificado
                  </Typography>
                  
                  {certificate && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Certificado atual expira em: {formatDate(certificate.expiration_date)}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box
                    sx={{
                      border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }
                    }}
                  >
                    {formData.file ? (
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Typography variant="body1">
                          {formData.file.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={handleRemoveFile}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept=".pfx,.p12"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="certificate-file"
                          disabled={saving || viewOnly}
                        />
                        <label htmlFor="certificate-file">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <UploadIcon fontSize="large" color="primary" />
                            <Typography variant="body1">
                              {id ? 'Clique para atualizar o certificado' : 'Clique para selecionar o certificado'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Formatos aceitos: .pfx, .p12
                            </Typography>
                          </Box>
                        </label>
                      </>
                    )}
                  </Box>
                  {errors.file && (
                    <FormHelperText error>{errors.file}</FormHelperText>
                  )}
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                  disabled={saving}
                >
                  Voltar
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </DashboardLayout>
  );
};

export default CertificateFormPage; 