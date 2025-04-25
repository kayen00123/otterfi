import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, useTheme } from '@mui/material';

const TrendingSolanaTokens = () => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create an iframe to isolate the widget
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
      
      // Append iframe to container
      containerRef.current.appendChild(iframe);
      
      // Set iframe content
      const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LiveCoinWatch Trending Tokens</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background-color: transparent;
            }
            .widget-container {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          </style>
          <script defer src="https://www.livecoinwatch.com/static/lcw-widget.js"></script>
        </head>
        <body>
          <div class="widget-container">
            <div class="livecoinwatch-widget-5" 
              lcw-base="USD" 
              lcw-color-tx="${theme.palette.mode === 'dark' ? '#FFFFFF' : '#333333'}" 
              lcw-marquee-1="movers" 
              lcw-marquee-2="movers" 
              lcw-marquee-items="30" 
              lcw-platform="SOL">
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Set iframe src to the HTML content
      const blob = new Blob([iframeContent], { type: 'text/html' });
      iframe.src = URL.createObjectURL(blob);
    };
    
    // Create the iframe with the widget
    try {
      createIframe();
    } catch (err) {
      console.error('Error creating LiveCoinWatch trending tokens widget:', err);
      setError('Failed to load trending tokens');
    }
    
    // Clean up function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme.palette.mode]);

  if (error) {
    return null; // Don't show anything if there's an error
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        width: '100%',
        height: 60,
        mb: 3,
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)'
      }}
    >
      <Box 
        ref={containerRef} 
        sx={{ 
          height: '100%',
          width: '100%'
        }}
      />
    </Paper>
  );
};

export default TrendingSolanaTokens;
