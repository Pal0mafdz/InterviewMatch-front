import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#C9521A',
      light: '#E07644',
      dark: '#9B3D12',
      contrastText: '#FFFDF7',
    },
    secondary: {
      main: '#E8A620',
      light: '#F5C84A',
      dark: '#C4860A',
      contrastText: '#1A0F08',
    },
    background: {
      default: '#F0E4CC',
      paper: '#FBF3E3',
    },
    text: {
      primary: '#1A0F08',
      secondary: '#7A4F2D',
    },
    divider: '#DFC99A',
    error: {
      main: '#C62828',
    },
    success: {
      main: '#2E7D32',
    },
  },
  typography: {
    fontFamily: "'Lato', sans-serif",
    h1: { fontFamily: "'Playfair Display', serif" },
    h2: { fontFamily: "'Playfair Display', serif" },
    h3: { fontFamily: "'Playfair Display', serif" },
    h4: { fontFamily: "'Playfair Display', serif" },
    h5: { fontFamily: "'Playfair Display', serif" },
    h6: { fontFamily: "'Playfair Display', serif" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: "'Lato', sans-serif",
          fontWeight: 700,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Lato', sans-serif",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#7A4F2D',
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: '#F0E4CC',
        },
      },
    },
  },
})
