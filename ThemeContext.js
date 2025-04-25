import React, { createContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Select, MenuItem } from '@mui/material'; // Add these imports

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'dark',
});

export const ColorModeContextProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode
                primary: {
                  main: '#9945FF',
                },
                secondary: {
                  main: '#14F195',
                },
                background: {
                  default: '#f5f7fa',
                  paper: '#ffffff',
                },
              }
            : {
                // Dark mode
                primary: {
                  main: '#9945FF',
                },
                secondary: {
                  main: '#14F195',
                },
                background: {
                  default: '#0f0c29',
                  paper: '#1a1a2e',
                },
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 12,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
