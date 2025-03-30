import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper, 
  ClickAwayListener,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Close as CloseIcon,
  LocalOffer as TagIcon,
  Person as PersonIcon,
  ShoppingCart as ProductIcon,
  Receipt as OrderIcon,
  Article as DocumentIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMuiTheme } from '../../context/ThemeContext';

interface SearchBarProps {
  onClose: () => void;
}

interface SearchResult {
  id: string | number;
  title: string;
  description: string;
  type: 'cliente' | 'produto' | 'pedido' | 'documento' | 'recurso';
  tags?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onClose }) => {
  const theme = useMuiTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focar no input quando o componente é montado
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    // Mock da busca
    const timer = setTimeout(() => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        // Simulação de resultados de busca com tipos explicitamente definidos
        const mockResults = [
          {
            id: 1,
            title: 'Maria Silva',
            description: 'Cliente Premium - ID: 1001',
            type: 'cliente' as const,
            tags: ['premium', 'fidelidade']
          },
          {
            id: 'prod-123',
            title: 'Arroz Integral',
            description: 'Estoque: 45 unidades - R$ 8,99',
            type: 'produto' as const,
            tags: ['alimentos', 'grãos']
          },
          {
            id: 'ord-456',
            title: 'Pedido #4562',
            description: 'R$ 156,78 - 10/05/2023',
            type: 'pedido' as const,
            tags: ['entregue', 'pago']
          },
          {
            id: 'doc-789',
            title: 'Relatório Mensal',
            description: 'Análise de vendas - Maio/2023',
            type: 'documento' as const
          },
          {
            id: 'rec-012',
            title: 'Guia de Usuário',
            description: 'Documentação do sistema',
            type: 'recurso' as const
          }
        ].filter(result => 
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        setSearchResults(mockResults);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleClear = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'cliente':
        return <PersonIcon sx={{ color: theme.palette.primary.main }} />;
      case 'produto':
        return <ProductIcon sx={{ color: theme.palette.success.main }} />;
      case 'pedido':
        return <OrderIcon sx={{ color: theme.palette.warning.main }} />;
      case 'documento':
      case 'recurso':
      default:
        return <DocumentIcon sx={{ color: theme.palette.info.main }} />;
    }
  };
  
  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 1,
          zIndex: 1200
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 0.5,
            width: '100%',
            maxWidth: 600,
            mx: 'auto',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <InputAdornment position="start" sx={{ mr: 1 }}>
              <SearchIcon 
                color="primary" 
                sx={{ 
                  fontSize: 24,
                  filter: isSearching ? 'none' : `drop-shadow(0 2px 5px ${alpha(theme.palette.primary.main, 0.3)})`
                }} 
              />
            </InputAdornment>
            
            <TextField
              fullWidth
              autoFocus
              variant="standard"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={handleInputChange}
              inputRef={inputRef}
              InputProps={{
                disableUnderline: true,
                sx: { 
                  fontSize: '1.1rem',
                  py: 1.5,
                  '&::placeholder': {
                    color: alpha(theme.palette.text.primary, 0.6),
                    opacity: 1
                  }
                }
              }}
            />
            
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconButton 
                    size="small" 
                    onClick={handleClear}
                    sx={{ 
                      color: alpha(theme.palette.text.primary, 0.6),
                      '&:hover': {
                        color: theme.palette.error.main,
                        bgcolor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </motion.div>
              )}
            </AnimatePresence>
            
            <IconButton 
              size="small" 
              onClick={onClose}
              sx={{ 
                ml: 0.5,
                color: alpha(theme.palette.text.primary, 0.6),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Divider sx={{ my: 0.5 }} />
                
                <List sx={{ 
                  maxHeight: 320, 
                  overflow: 'auto',
                  px: 0.5,
                  py: 0
                }}>
                  {searchResults.map((result) => (
                    <motion.div
                      key={result.id.toString()}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItem
                        alignItems="flex-start"
                        sx={{ 
                          py: 1.5, 
                          px: 1,
                          borderRadius: 1.5,
                          my: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <Avatar 
                          variant="rounded" 
                          sx={{ 
                            mr: 2, 
                            bgcolor: alpha(
                              result.type === 'cliente' ? theme.palette.primary.main : 
                              result.type === 'produto' ? theme.palette.success.main :
                              result.type === 'pedido' ? theme.palette.warning.main :
                              theme.palette.info.main, 
                              0.1
                            ),
                            color: 
                              result.type === 'cliente' ? theme.palette.primary.main : 
                              result.type === 'produto' ? theme.palette.success.main :
                              result.type === 'pedido' ? theme.palette.warning.main :
                              theme.palette.info.main,
                            width: 42,
                            height: 42
                          }}
                        >
                          {getIconForType(result.type)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" component="span" fontWeight={500}>
                              {result.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                              >
                                {result.description}
                              </Typography>
                              {result.tags && result.tags.length > 0 && (
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {result.tags.map(tag => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      icon={<TagIcon fontSize="small" />}
                                      sx={{ 
                                        height: 24, 
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        borderColor: alpha(theme.palette.primary.main, 0.2),
                                        '& .MuiChip-icon': { fontSize: '0.8rem' }
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
                
                <Box 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center',
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="primary"
                    sx={{ 
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Ver todos os resultados para "{searchQuery}"
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Paper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar; 