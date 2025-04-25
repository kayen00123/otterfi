import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, useTheme } from '@mui/material';

const TradingViewChart = ({ fromToken, toToken }) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only proceed if we have a fromToken
    if (!fromToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create an iframe to display the GeckoTerminal chart
    const createIframe = () => {
      if (!containerRef.current) return;
      
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.id = 'geckoterminal-embed';
      iframe.title = 'GeckoTerminal Embed';
      
      // Use direct token URL instead of pool URL
      iframe.src = `https://www.geckoterminal.com/solana/tokens/${fromToken.address}?embed=1&info=0&swaps=0&chart_type=price&resolution=15m&light_chart=${theme.palette.mode === 'dark' ? '0' : '1'}`;
      
      iframe.frameBorder = '0';
      iframe.allow = 'clipboard-write';
      iframe.allowFullscreen = true;
      
      // Append iframe to container
      containerRef.current.appendChild(iframe);
      
      // Wait for iframe to load
      iframe.onload = () => {
        setLoading(false);
      };
      
      // Set a timeout in case the iframe doesn't load properly
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    };
    
    try {
      createIframe();
    } catch (err) {
      console.error('Error loading GeckoTerminal chart:', err);
      setError('Failed to load chart');
      setLoading(false);
    }
    
    // Clean up function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [fromToken, theme.palette.mode]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        width: '100%',
        height: 400,
        mb: 3,
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {fromToken ? `${fromToken.symbol} Price Chart` : 'Price Chart'}
      </Typography>
      
      {!fromToken ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="text.secondary">
            Select tokens to view chart
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="error">
            {error}
          </Typography>
        </Box>
      ) : (
        <Box 
          ref={containerRef} 
          sx={{ 
            height: 'calc(100% - 40px)',
            width: '100%'
          }}
        />
      )}
    </Paper>
  );
};

export default TradingViewChart;




