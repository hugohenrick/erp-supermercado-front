import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Fab,
  Drawer,
  Tooltip,
  Badge,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Face as FaceIcon,
  Chat as ChatIcon,
  SupportAgent as SupportAgentIcon,
  History as HistoryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { mcpService, MCPHistoryMessage } from '../../services/mcpService';
import { useMuiTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatAssistant: React.FC = () => {
  const theme = useMuiTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar histórico quando o chat é aberto
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const history = await mcpService.getHistory();
      
      // Se não houver histórico, criar mensagem de boas-vindas
      if (history.length === 0) {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: "Olá! Eu sou a Angie, sua assistente virtual. 👋\n\nEstou aqui para ajudar você com suas dúvidas e necessidades. Como posso te ajudar hoje?",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } else {
        const formattedMessages: Message[] = history.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role === 'assistant' ? 'assistant' : 'user',
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Criar mensagem de boas-vindas mesmo em caso de erro
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Olá! Eu sou a Angie, sua assistente virtual. 👋\n\nEstou aqui para ajudar você com suas dúvidas e necessidades. Como posso te ajudar hoje?",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mcpService.sendMessage(userMessage.text);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao processar sua mensagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const AssistantAvatar = () => (
    <Avatar
      sx={{
        bgcolor: 'transparent',
        border: `2px solid ${theme.palette.primary.main}`,
        width: 48,
        height: 48,
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
        padding: 0,
        '& .MuiAvatar-img': {
          objectFit: 'cover',
          objectPosition: 'center 30%',
          width: '100%',
          height: '100%'
        }
      }}
      src="/avatarAngie.png"
      alt="Angie"
    />
  );
  
  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 2,
        gap: 1
      }}
    >
      {message.sender === 'assistant' && <AssistantAvatar />}
      
      <Box
        sx={{
          maxWidth: '70%',
          p: 2,
          borderRadius: 2,
          bgcolor: message.sender === 'user'
            ? alpha(theme.palette.primary.main, 0.1)
            : theme.palette.background.paper,
          boxShadow: message.sender === 'user'
            ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
            : `0 2px 8px ${alpha(theme.palette.divider, 0.1)}`,
          border: `1px solid ${alpha(
            message.sender === 'user'
              ? theme.palette.primary.main
              : theme.palette.divider,
            0.1
          )}`
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
  
  return (
    <>
      <Tooltip title="Chat com a Angie" placement="left">
        <Fab
          color="primary"
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.9),
            '&:hover': {
              bgcolor: theme.palette.primary.main
            }
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#44b700',
                color: '#44b700',
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                '&::after': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  animation: 'ripple 1.2s infinite ease-in-out',
                  border: '1px solid currentColor',
                  content: '""',
                },
              },
              '@keyframes ripple': {
                '0%': {
                  transform: 'scale(.8)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'scale(2.4)',
                  opacity: 0,
                },
              },
            }}
          >
            <Avatar
              src="/avatarAngie.png"
              alt="Angie"
              sx={{
                width: 45,
                height: 45,
                padding: 0,
                background: 'transparent',
                '& .MuiAvatar-img': {
                  objectFit: 'cover',
                  objectPosition: 'center 30%',
                  width: '100%',
                  height: '100%'
                }
              }}
            />
          </Badge>
        </Fab>
      </Tooltip>
      
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 400,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            marginTop: '64px',
            height: 'calc(100% - 64px)',
            zIndex: (theme) => theme.zIndex.drawer
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`
            }}
          >
            <AssistantAvatar />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Angie
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assistente Virtual • Online
              </Typography>
            </Box>
            <Tooltip title="Recarregar histórico">
              <IconButton 
                onClick={loadChatHistory}
                disabled={isLoadingHistory}
                sx={{ mr: 1 }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Paper>
          
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: alpha(theme.palette.background.default, 0.5)
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {isLoadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AnimatePresence>
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <MessageBubble message={message} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Angie está digitando...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Input */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Digite sua mensagem..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                    color: 'white'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Drawer>
    </>
  );
};

export default ChatAssistant; 