import React from 'react';
import { LiFiWidget } from '@lifi/widget';
import { Box, Container, Typography, Paper, useTheme } from '@mui/material';
import Header from '../components/Header';
import { useWallet } from '@solana/wallet-adapter-react';

const CrossChainPage = () => {
  const theme = useTheme();
  const wallet = useWallet();

  // Configuration for the LiFi widget with your API key and fee setup
  const widgetConfig = {
    appearance: theme.palette.mode === 'dark' ? 'dark' : 'light',
    containerStyle: {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
    },
    integrator: 'otterfi', // Your integrator string (lowercase as recommended by LiFi)
    fee: 0.008, // 0.8% fee
    // Configure RPC URLs - use LiFi's default for Solana instead of Helius
    // This should resolve the 403 error
    rpcUrls: {
      // Let LiFi use their default Solana RPC which has proper permissions
      // solana: 'https://mainnet.helius-rpc.com/?api-key=887a40ac-2f47-4df7-bc37-1b9589ba5a48'
    },
    // Set your wallets for fee collection
    wallets: {
      // EVM wallet for fee collection
      evm: '0x95c448c49F07B11F0201c4Df19E7a0DE7AEB2865',
      // Solana wallet for fee collection
      solana: '5xayu3sbV3xD6fRUapYo5geZecnFzjRnqrHDdSXfbQLr'
    },
    // Your LiFi API key
    apiKey: 'b4bf362f-0c29-4234-970e-d49ad773cdf6.91b5516b-0778-4d8c-86f0-e1867ccd7ae0',
    // Additional widget configuration
    variant: 'expandable', // Use expandable variant for better UX
    subvariant: 'default',
    hiddenUI: ['poweredBy'], // Hide powered by to make it look more native
    disabledUI: [],
    // Fix for the requiredUI error - use an array instead of an object
    requiredUI: ['feeDisclaimer']
  };

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
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
            Cross-Chain Swap
          </Typography>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 4,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)'
            }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              Swap tokens across different blockchains seamlessly. Our cross-chain bridge aggregates multiple bridges and DEXs to find the best routes for your swaps between Solana and all EVM chains.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Low fees and competitive rates across chains<br />
              • Support for 20+ blockchains including Ethereum, Solana, Polygon, Arbitrum, and more<br />
              • Secure and audited smart contracts
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 4,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)',
              height: '700px'
            }}
          >
            <LiFiWidget
              config={widgetConfig}
              integrator="otterfi"
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default CrossChainPage;

