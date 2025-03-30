import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Box, Fab, Tooltip, alpha } from '@mui/material';
import { SupportAgent as SupportIcon } from '@mui/icons-material';
import { useMuiTheme } from '../../context/ThemeContext';

// Importação lazy do ChatAssistant para evitar problemas de carregamento
const ChatAssistant = lazy(() => import('./ChatAssistant'));

const ChatAssistantWrapper: React.FC = () => {
  const theme = useMuiTheme();
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Se o componente está em modo de desenvolvimento, mostre o fallback em vez do assistente
  useEffect(() => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      // Se estiver em desenvolvimento e a funcionalidade do chat não for suportada
      // pelo backend, você pode escolher mostrar apenas um fallback
      const isMCPDisabled = false; // Defina como true para desabilitar o chat em dev
      setShowFallback(isDev && isMCPDisabled);
    } catch (error) {
      console.error('Erro ao verificar ambiente:', error);
      setShowFallback(true);
    }
  }, []);

  // Em caso de erro, mostramos apenas um botão que abre uma nova guia para suporte
  if (hasError || showFallback) {
    return (
      <Tooltip title="Suporte" placement="left">
        <Fab
          color="primary"
          onClick={() => window.open('mailto:suporte@erpsupermercado.com.br', '_blank')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
        >
          <SupportIcon />
        </Fab>
      </Tooltip>
    );
  }

  // Envolve o componente com ErrorBoundary e Suspense para carregamento lazy
  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <Suspense fallback={null}>
        <ChatAssistant />
      </Suspense>
    </ErrorBoundary>
  );
};

// Componente de tratamento de erro simples
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro no componente do Chat:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export default ChatAssistantWrapper; 