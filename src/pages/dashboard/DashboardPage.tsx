import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  MonetizationOn as MonetizationOnIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ShoppingBag as ShoppingBagIcon,
  CalendarToday as CalendarTodayIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'framer-motion';

// Importamos um gráfico fictício
// Em um projeto real, você importaria bibliotecas como recharts, visx, ou react-chartjs-2
const SalesChart = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Dados ficticios para o gráfico
  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    values: [30, 40, 35, 50, 49, 60]
  };
  
  return (
    <Box
      sx={{
        height: 250,
        position: 'relative',
        width: '100%'
      }}
    >
      {/* Em um projeto real, isso seria substituído por um componente de gráfico real */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80%',
          display: 'flex',
          alignItems: 'flex-end',
          px: 4
        }}
      >
        {chartData.values.map((value, index) => (
          <Box
            key={index}
            component={motion.div}
            initial={{ height: 0 }}
            animate={{ height: `${value * 3}px` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            sx={{
              flex: 1,
              mx: 1,
              borderRadius: '4px 4px 0 0',
              background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.light, 0.3)} 100%)`,
              position: 'relative',
              '&:hover': {
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 1)} 0%, ${alpha(theme.palette.primary.main, 0.5)} 100%)`,
                transform: 'scaleY(1.05)',
                transformOrigin: 'bottom',
                transition: 'transform 0.3s ease',
                cursor: 'pointer'
              }
            }}
          >
            <Tooltip title={`${chartData.labels[index]}: R$ ${value * 1000}`} placement="top">
              <Box
                sx={{
                  position: 'absolute',
                  top: -25,
                  left: 0,
                  right: 0,
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                  sx={{ 
                    fontWeight: 600,
                    color: isDark ? theme.palette.primary.light : theme.palette.primary.dark
                  }}
                >
                  {chartData.labels[index]}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Componente para o gráfico de pizza
const ProductCategoryChart = () => {
  const theme = useTheme();
  
  // Dados fictícios para o gráfico
  const categories = [
    { name: 'Alimentos', percentage: 40, color: theme.palette.primary.main },
    { name: 'Bebidas', percentage: 25, color: theme.palette.success.main },
    { name: 'Limpeza', percentage: 15, color: theme.palette.warning.main },
    { name: 'Higiene', percentage: 20, color: theme.palette.info.main }
  ];
  
  return (
    <Box sx={{ position: 'relative', height: 200, width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Box
        sx={{
          position: 'relative',
          width: 170,
          height: 170,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        {categories.map((category, index) => {
          const startAngle = categories
            .slice(0, index)
            .reduce((sum, cat) => sum + cat.percentage, 0) * 3.6;
          const endAngle = startAngle + category.percentage * 3.6;
          
          return (
            <Box
              key={category.name}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: `conic-gradient(${category.color} ${startAngle}deg, ${category.color} ${endAngle}deg, transparent ${endAngle}deg)`,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: `scale(1.05) rotate(${startAngle + (endAngle - startAngle) / 2 - 90}deg)`,
                  zIndex: 10,
                  filter: `drop-shadow(0px 0px 10px ${alpha(category.color, 0.5)})`
                }
              }}
            />
          );
        })}
        <Box
          sx={{
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            bgcolor: theme.palette.background.paper,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Produtos
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ 
        position: 'absolute', 
        right: 0, 
        top: 10, 
        bottom: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        gap: 1
      }}>
        {categories.map((category, index) => (
          <Box 
            key={category.name}
            component={motion.div}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: category.color, 
                borderRadius: 1,
                boxShadow: `0 0 0 2px ${alpha(category.color, 0.2)}`
              }} 
            />
            <Typography variant="caption" fontWeight={500}>
              {category.name} ({category.percentage}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [dateRange, setDateRange] = useState('Esta semana');
  
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleDateRangeSelect = (range: string) => {
    setDateRange(range);
    handleFilterClose();
  };

  // Dados fictícios das métricas
  const metrics = [
    {
      title: 'Vendas Totais',
      value: 'R$ 24.530,00',
      growth: 12.5,
      icon: <MonetizationOnIcon />,
      color: theme.palette.primary.main,
      period: 'este mês'
    },
    {
      title: 'Novos Pedidos',
      value: '234',
      growth: 5.3,
      icon: <ShoppingCartIcon />,
      color: theme.palette.success.main,
      period: 'esta semana'
    },
    {
      title: 'Clientes Ativos',
      value: '540',
      growth: -2.7,
      icon: <PeopleIcon />,
      color: theme.palette.warning.main,
      period: 'este mês'
    },
    {
      title: 'Produtos Baixo Estoque',
      value: '12',
      growth: 24.5,
      icon: <InventoryIcon />,
      color: theme.palette.error.main,
      period: 'agora'
    }
  ];
  
  // Dados fictícios para produtos mais vendidos
  const topProducts = [
    { id: 1, name: 'Arroz Integral', category: 'Alimentos', sales: 230, price: 'R$ 8,99', stock: 64 },
    { id: 2, name: 'Leite Semidesnatado', category: 'Laticínios', sales: 187, price: 'R$ 5,49', stock: 42 },
    { id: 3, name: 'Sabão em Pó', category: 'Limpeza', sales: 126, price: 'R$ 21,90', stock: 38 },
    { id: 4, name: 'Café Premium', category: 'Bebidas', sales: 104, price: 'R$ 16,75', stock: 25 }
  ];
  
  // Dados fictícios para vendas recentes
  const recentSales = [
    { id: '#32454', customer: 'Marcela Silva', date: '15 min atrás', amount: 'R$ 256,70', status: 'concluído' },
    { id: '#32453', customer: 'João Pereira', date: '45 min atrás', amount: 'R$ 124,30', status: 'pendente' },
    { id: '#32452', customer: 'Ana Sousa', date: '2 horas atrás', amount: 'R$ 387,15', status: 'concluído' },
    { id: '#32451', customer: 'Ricardo Oliveira', date: '5 horas atrás', amount: 'R$ 198,50', status: 'cancelado' }
  ];
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box 
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="bold"
              sx={{ 
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Dashboard
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center' 
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Visão geral de: {dateRange}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              startIcon={<RefreshIcon />}
              variant="outlined" 
              color="primary"
              sx={{ 
                borderRadius: 2,
                px: 2,
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px'
                }
              }}
            >
              Atualizar
            </Button>
            <Button 
              variant="contained" 
              startIcon={<FilterListIcon />}
              endIcon={<NavigateNextIcon />}
              onClick={handleFilterClick}
              color="primary"
              sx={{ 
                borderRadius: 2,
                px: 2,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              {dateRange}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              PaperProps={{
                sx: { 
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                  mt: 1.5
                }
              }}
            >
              {['Hoje', 'Esta semana', 'Este mês', 'Este ano', 'Personalizado'].map((option) => (
                <MenuItem 
                  key={option} 
                  onClick={() => handleDateRangeSelect(option)}
                  selected={dateRange === option}
                  sx={{ 
                    py: 1.2,
                    borderRadius: 1,
                    mx: 0.5,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      }
                    }
                  }}
                >
                  {option}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
        
        <Grid 
          container 
          spacing={3}
          component={motion.div}
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Métricas */}
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div variants={item}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: `0 6px 16px ${alpha(theme.palette.mode === 'dark' ? '#000' : metric.color, 0.1)}`,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 12px 20px ${alpha(theme.palette.mode === 'dark' ? '#000' : metric.color, 0.15)}`
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      width: 100, 
                      height: 100, 
                      borderRadius: '0 0 0 100%',
                      opacity: 0.07,
                      bgcolor: metric.color
                    }} 
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(metric.color, 0.1), 
                          p: 1, 
                          borderRadius: 2,
                          color: metric.color,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 42,
                          height: 42
                        }}
                      >
                        {metric.icon}
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          bgcolor: metric.growth > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                          color: metric.growth > 0 ? theme.palette.success.main : theme.palette.error.main,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {metric.growth > 0 ? <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14, mr: 0.5 }} />}
                        {Math.abs(metric.growth)}%
                      </Box>
                    </Box>
                    
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 2, color: metric.color }}>
                      {metric.value}
                    </Typography>
                    
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {metric.title}
                      </Typography>
                      <Chip 
                        label={metric.period} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem',
                          bgcolor: alpha(metric.color, 0.1),
                          color: metric.color,
                          fontWeight: 'bold'
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
          
          {/* Gráfico de vendas */}
          <Grid item xs={12} md={8}>
            <motion.div variants={item}>
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Desempenho de Vendas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de vendas dos últimos 6 meses
                    </Typography>
                  </Box>
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: 3
                  }}
                >
                  <Typography variant="h5" component="div" fontWeight="bold">
                    R$ 258.400,00
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: theme.palette.success.main,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    8.2%
                  </Box>
                </Box>
                
                <SalesChart />
              </Card>
            </motion.div>
          </Grid>
          
          {/* Distribuição de categorias de produtos */}
          <Grid item xs={12} md={4}>
            <motion.div variants={item}>
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Categorias de Produtos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distribuição por porcentagem de vendas
                    </Typography>
                  </Box>
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <ProductCategoryChart />
              </Card>
            </motion.div>
          </Grid>
          
          {/* Produtos mais vendidos */}
          <Grid item xs={12} md={6}>
            <motion.div variants={item}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    px: 3, 
                    py: 2,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Produtos Mais Vendidos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Top 4 produtos com mais saída
                    </Typography>
                  </Box>
                  <Button 
                    endIcon={<NavigateNextIcon />}
                    variant="text"
                    color="primary"
                  >
                    Ver todos
                  </Button>
                </Box>
                
                <Box 
                  sx={{ 
                    pt: 1, 
                    pb: 2,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {topProducts.map((product, index) => (
                    <Box 
                      key={product.id}
                      component={motion.div}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ListItem 
                        sx={{ 
                          px: 3, 
                          py: 1.5, 
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            variant="rounded"
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            <ShoppingBagIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" component="span" fontWeight={500}>
                              {product.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {product.category}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={product.stock > 30 ? 'Em estoque' : 'Baixo estoque'} 
                                sx={{ 
                                  ml: 1, 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  fontWeight: 'medium',
                                  bgcolor: product.stock > 30 
                                    ? alpha(theme.palette.success.main, 0.1) 
                                    : alpha(theme.palette.warning.main, 0.1),
                                  color: product.stock > 30 
                                    ? theme.palette.success.main 
                                    : theme.palette.warning.main
                                }}
                              />
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary">
                            {product.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {product.sales} vendas
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < topProducts.length - 1 && (
                        <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Vendas recentes */}
          <Grid item xs={12} md={6}>
            <motion.div variants={item}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    px: 3, 
                    py: 2,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Vendas Recentes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Últimas 4 transações do sistema
                    </Typography>
                  </Box>
                  <Button 
                    endIcon={<NavigateNextIcon />}
                    variant="text"
                    color="primary"
                  >
                    Ver todas
                  </Button>
                </Box>
                
                <Box 
                  sx={{ 
                    pt: 1, 
                    pb: 2,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {recentSales.map((sale, index) => (
                    <Box 
                      key={sale.id}
                      component={motion.div}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ListItem 
                        sx={{ 
                          px: 3, 
                          py: 1.5, 
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(
                                sale.status === 'concluído' ? theme.palette.success.main :
                                sale.status === 'pendente' ? theme.palette.warning.main :
                                theme.palette.error.main,
                                0.1
                              ),
                              color: 
                                sale.status === 'concluído' ? theme.palette.success.main :
                                sale.status === 'pendente' ? theme.palette.warning.main :
                                theme.palette.error.main
                            }}
                          >
                            {sale.customer.substring(0, 1).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" component="span" fontWeight={500}>
                                {sale.customer}
                              </Typography>
                              <Chip 
                                size="small" 
                                icon={<LocalOfferIcon sx={{ fontSize: '0.75rem !important' }} />}
                                label={sale.id} 
                                sx={{ 
                                  ml: 1, 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  fontWeight: 'medium',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  '& .MuiChip-icon': { 
                                    color: theme.palette.primary.main,
                                    ml: 0.5,
                                    mr: -0.25
                                  }
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" component="span">
                              {sale.date}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary">
                            {sale.amount}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={sale.status} 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem',
                              fontWeight: 'medium',
                              mt: 0.5,
                              bgcolor: 
                                sale.status === 'concluído' ? alpha(theme.palette.success.main, 0.1) :
                                sale.status === 'pendente' ? alpha(theme.palette.warning.main, 0.1) :
                                alpha(theme.palette.error.main, 0.1),
                              color: 
                                sale.status === 'concluído' ? theme.palette.success.main :
                                sale.status === 'pendente' ? theme.palette.warning.main :
                                theme.palette.error.main
                            }}
                          />
                        </Box>
                      </ListItem>
                      {index < recentSales.length - 1 && (
                        <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default DashboardPage; 