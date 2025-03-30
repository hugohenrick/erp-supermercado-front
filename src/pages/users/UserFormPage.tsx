import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import { User, UserRole, UserStatus } from '../../services/api';
import { userService } from '../../services/userService';
import { useBranch } from '../../context/BranchContext';

interface FormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  branchId?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

interface UserFormPageProps {
  viewOnly?: boolean;
}

const UserFormPage: React.FC<UserFormPageProps> = ({ viewOnly = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { activeBranch } = useBranch();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: UserRole.EMPLOYEE,
    branchId: activeBranch?.id
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);
  
  const fetchUser = async () => {
    try {
      setLoading(true);
      const user = await userService.getUserById(id!);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role || UserRole.EMPLOYEE,
        branchId: user.branchId
      });
    } catch (err) {
      setError('Erro ao carregar dados do usuário. Por favor, tente novamente.');
      console.error('Erro ao buscar usuário:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!isEditing && !formData.password?.trim()) {
      newErrors.password = 'Senha é obrigatória para novos usuários';
    }
    
    if (!formData.role) {
      newErrors.role = 'Função é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditing) {
        await userService.updateUser(id!, formData);
      } else {
        await userService.createUser(formData);
      }
      
      navigate('/users');
    } catch (err) {
      setError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário. Por favor, tente novamente.`);
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
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
  };
  
  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name!]: value as UserRole
    }));
    // Limpar erro do campo quando o usuário seleciona um valor
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name!]: undefined
      }));
    }
  };
  
  if (loading && isEditing) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {viewOnly ? 'Visualizar Usuário' : isEditing ? 'Editar Usuário' : 'Novo Usuário'}
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                disabled={loading || viewOnly}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                disabled={loading || viewOnly}
              />
            </Grid>
            
            {!isEditing && !viewOnly && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  disabled={loading}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.role)}>
                <InputLabel>Função</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleSelectChange}
                  disabled={loading || viewOnly}
                >
                  <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                  <MenuItem value={UserRole.MANAGER}>Gerente</MenuItem>
                  <MenuItem value={UserRole.EMPLOYEE}>Funcionário</MenuItem>
                  <MenuItem value={UserRole.CASHIER}>Caixa</MenuItem>
                </Select>
                {errors.role && (
                  <FormHelperText>{errors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
          
          {!viewOnly && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/users')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </Box>
          )}
        </form>
      </Paper>
    </Container>
  );
};

export default UserFormPage; 