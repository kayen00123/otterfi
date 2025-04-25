import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import Header from '../components/Header';
import FarmsList from '../components/FarmsList';

const FarmsPage = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' 
        : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="lg">
        <Header />
        <Box sx={{ mt: 4 }}>
          <FarmsList />
        </Box>
      </Container>
    </Box>
  );
};

export default FarmsPage;
