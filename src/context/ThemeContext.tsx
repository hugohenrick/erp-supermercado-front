import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Paleta de cores moderna
const lightPalette = {
  primary: {
    main: '#2563eb', // Azul mais vibrante
    light: '#60a5fa',
    dark: '#1e40af',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ec4899', // Rosa mais vibrante
    light: '#f472b6',
    dark: '#be185d',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981', // Verde esmeralda
    light: '#34d399',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef4444', // Vermelho mais vibrante
    light: '#f87171',
    dark: '#b91c1c',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b', // Âmbar mais vibrante
    light: '#fbbf24',
    dark: '#b45309',
    contrastText: '#ffffff',
  },
  info: {
    main: '#06b6d4', // Ciano/turquesa vibrante
    light: '#22d3ee',
    dark: '#0e7490',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f8fafc', // Cinza muito claro
    paper: '#ffffff',
  },
  text: {
    primary: '#1e293b', // Cinza escuro
    secondary: '#64748b', // Cinza médio
  },
};

const darkPalette = {
  primary: {
    main: '#3b82f6', // Azul mais vibrante
    light: '#93c5fd',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f472b6', // Rosa mais vibrante
    light: '#f9a8d4',
    dark: '#db2777',
    contrastText: '#ffffff',
  },
  success: {
    main: '#34d399', // Verde esmeralda
    light: '#6ee7b7',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f87171', // Vermelho mais suave
    light: '#fca5a5',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#fbbf24', // Âmbar mais suave
    light: '#fcd34d',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  info: {
    main: '#22d3ee', // Ciano/turquesa vibrante
    light: '#67e8f9',
    dark: '#0891b2',
    contrastText: '#ffffff',
  },
  background: {
    default: '#0f172a', // Azul muito escuro
    paper: '#1e293b', // Cinza azulado escuro
  },
  text: {
    primary: '#f1f5f9', // Quase branco
    secondary: '#94a3b8', // Cinza claro
  },
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Obter preferência de tema do localStorage ou usar 'light' como padrão
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  useEffect(() => {
    // Salvar preferência de tema no localStorage quando mudar
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Criar o tema Material UI com base no modo
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          },
          containedPrimary: {
            background: mode === 'light' 
              ? 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' 
              : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          },
          containedSecondary: {
            background: mode === 'light'
              ? 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)'
              : 'linear-gradient(90deg, #f472b6 0%, #f9a8d4 100%)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: mode === 'light' 
              ? '0px 4px 20px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 20px rgba(0, 0, 0, 0.3)',
          },
          elevation1: {
            boxShadow: mode === 'light'
              ? '0px 2px 8px rgba(0, 0, 0, 0.05)'
              : '0px 2px 8px rgba(0, 0, 0, 0.2)',
          },
          elevation2: {
            boxShadow: mode === 'light'
              ? '0px 4px 16px rgba(0, 0, 0, 0.08)'
              : '0px 4px 16px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light'
                ? '0px 12px 24px rgba(0, 0, 0, 0.1)'
                : '0px 12px 24px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0 2px 10px rgba(0, 0, 0, 0.05)'
              : '0 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundImage: mode === 'light'
              ? 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)'
              : 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'light'
              ? 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
              : 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            margin: '4px 8px',
            '&:hover': {
              backgroundColor: mode === 'light'
                ? 'rgba(37, 99, 235, 0.08)'
                : 'rgba(59, 130, 246, 0.15)',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'light'
                ? 'rgba(37, 99, 235, 0.12)'
                : 'rgba(59, 130, 246, 0.2)',
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(37, 99, 235, 0.18)'
                  : 'rgba(59, 130, 246, 0.25)',
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              },
              '&.Mui-focused': {
                boxShadow: mode === 'light'
                  ? '0 0 0 2px rgba(37, 99, 235, 0.2)'
                  : '0 0 0 2px rgba(59, 130, 246, 0.4)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: mode === 'light'
              ? '2px solid #ffffff'
              : '2px solid #1e293b',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar o contexto de tema
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 