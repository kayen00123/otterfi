import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  useTheme,
  Tooltip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';

const TrendingTokens = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        // Fetch tokens with the "birdeye-trending" tag
        // This tag indicates trending tokens on Birdeye (a Solana explorer)
        const response = await fetch('https://api.jup.ag/tokens/v1/tagged/birdeye-trending');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending tokens');
        }
        
        const trendingData = await response.json();
        
        // Sort by daily volume
        const sortedTokens = trendingData.sort((a, b) => 
          (b.daily_volume || 0) - (a.daily_volume || 0)
        ).slice(0, 10); // Get top 10
        
        setTrendingTokens(sortedTokens);
      } catch (error) {
        console.error('Error fetching trending tokens:', error);
        setError('Failed to load trending tokens');
        
        // Fallback: try to get verified tokens if trending tag fails
        try {
          const fallbackResponse = await fetch('https://api.jup.ag/tokens/v1/tagged/verified');
          if (fallbackResponse.ok) {
            const verifiedData = await fallbackResponse.json();
            // Sort by daily volume and take top 10
            const sortedTokens = verifiedData
              .filter(token => token.daily_volume)
              .sort((a, b) => (b.daily_volume || 0) - (a.daily_volume || 0))
              .slice(0, 10);
            
            setTrendingTokens(sortedTokens);
            setError('Trending tokens unavailable, showing top verified tokens');
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingTokens();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrendingTokens, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleTokenClick = (token) => {
    // Navigate to swap page with this token pre-selected
    navigate('/swap', { state: { fromToken: token } });
  };
  
  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };
  
  if (loading) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 4,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 4,
        width: '100%',
        mt: 4,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" fontWeight="bold">
          Trending Tokens
        </Typography>
        {error && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell align="right">Tags</TableCell>
              <TableCell align="right">24h Volume</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trendingTokens.map((token) => (
              <TableRow 
                key={token.address}
                onClick={() => handleTokenClick(token)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                      src={token.logoURI} 
                      alt={token.name} 
                      style={{ width: 24, height: 24, borderRadius: '50%' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                      }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {token.symbol}
                        </Typography>
                        {token.tags && token.tags.includes('verified') && (
                          <Tooltip title="Verified Token">
                            <VerifiedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {token.name}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
                    {token.tags && token.tags.slice(0, 3).map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.05)'
                        }} 
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {formatVolume(token.daily_volume)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TrendingTokens;
