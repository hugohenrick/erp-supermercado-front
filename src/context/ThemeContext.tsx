import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, useTheme as useMuiTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { blue, deepPurple } from '@mui/material/colors';
import { PaletteMode } from '@mui/material';

// Tipo para o contexto do tema
interface ThemeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

// Criar o contexto
const ThemeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'light'
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Recuperar preferência de tema do localStorage ou usar 'light' como padrão
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const storedMode = localStorage.getItem('themeMode');
      return (storedMode === 'dark' || storedMode === 'light') ? storedMode as PaletteMode : 'light';
    } catch (error) {
      console.error('Erro ao acessar localStorage para tema:', error);
      return 'light';
    }
  });

  // Alternar entre os modos claro e escuro
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('themeMode', newMode);
      } catch (error) {
        console.error('Erro ao salvar tema no localStorage:', error);
      }
      return newMode;
    });
  };

  // Configuração do tema MUI
  const theme = React.useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: blue[700],
          ...(mode === 'dark' && {
            main: blue[400],
          }),
        },
        secondary: {
          main: deepPurple[500],
          ...(mode === 'dark' && {
            main: deepPurple[300],
          }),
        },
        background: {
          default: mode === 'light' ? '#f8fafc' : '#121212',
          paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
      shape: {
        borderRadius: 8,
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
      },
    }),
    [mode],
  );

  // Atualizar o estilo do body quando o modo muda
  useEffect(() => {
    document.body.style.backgroundColor = 
      mode === 'light' ? '#f8fafc' : '#121212';
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook para usar o contexto de tema
export const useTheme = () => useContext(ThemeContext);

// Exportar o hook useTheme do MUI para acesso direto ao tema
export { useMuiTheme }; 