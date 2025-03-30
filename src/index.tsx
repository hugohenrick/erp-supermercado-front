import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import './index.css';

// Função para verificar o localStorage e tentar recuperar tokens
const checkAndRecoverAuth = () => {
  try {
    // Testa se o localStorage está funcionando
    const testKey = 'localStorage-test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Verifica se temos tokens no localStorage
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      console.log('Tokens encontrados no localStorage durante inicialização');
    } else {
      console.log('Nenhum token encontrado no localStorage durante inicialização');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao acessar localStorage:', error);
    return false;
  }
};

// Executar verificação antes de renderizar o app
if (!checkAndRecoverAuth()) {
  console.error('ALERTA: Problemas detectados com localStorage, autenticação pode falhar');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // StrictMode foi temporariamente removido para diagnóstico de múltiplas requisições
  // <React.StrictMode>
    <BrowserRouter>
      <SnackbarProvider maxSnack={3}>
        <App />
      </SnackbarProvider>
    </BrowserRouter>
  // </React.StrictMode>
); 