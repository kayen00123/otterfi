import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNavigate } from 'react-router-dom';

const PopularPairs = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [popularPairs, setPopularPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPopularPairs = async () => {
      try {
        // First, get the most traded tokens
        const response = await fetch('https://api.jup.ag/tokens/v1/tagged/verified');
        
        if (!response.ok) {
          throw new Error('Failed to fetch verified tokens');
        }
        
        const tokens = await response.json();
        
        // Sort by daily volume and get top tokens
        const topTokens = tokens
          .filter(token => token.daily_volume)
          .sort((a, b) => b.daily_volume - a.daily_volume)
          .slice(0, 10);
        
        // Find SOL and USDC tokens
        const solToken = tokens.find(t => t.symbol === 'SOL');
        const usdcToken = tokens.find(t => t.symbol === 'USDC');
        
        // Create popular pairs (common pairs with SOL and USDC)
        const pairs = [];
        
        // Add SOL pairs
        if (solToken) {
          topTokens.forEach(token => {
            if (token.symbol !== 'SOL' && token.symbol !== 'USDC') {
              pairs.push({
                fromToken: solToken,
                toToken: token,
                volume24h: (solToken.daily_volume + token.daily_volume) / 2,
                priceChange24h: Math.random() * 20 - 10 // Mock data for price change
              });
            }
          });
        }
        
        // Add USDC pairs
        if (usdcToken) {
          topTokens.forEach(token => {
            if (token.symbol !== 'USDC' && token.symbol !== 'SOL' && pairs.length < 8) {
              pairs.push({
                fromToken: usdcToken,
                toToken: token,
                volume24h: (usdcToken.daily_volume + token.daily_volume) / 2,
                priceChange24h: Math.random() * 20 - 10 // Mock data for price change
              });
            }
          });
        }
        
        // Sort pairs by volume
        pairs.sort((a, b) => b.volume24h - a.volume24h);
        
        // Take top 8 pairs
        setPopularPairs(pairs.slice(0, 8));
      } catch (error) {
        console.error('Error fetching popular pairs:', error);
        setError('Failed to load popular pairs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularPairs();
  }, []);
  
  const handlePairClick = (pair) => {
    // Navigate to swap page with this pair pre-selected
    navigate('/swap', { 
      state: { 
        fromToken: pair.fromToken,
        toToken: pair.toToken
      } 
    });
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
        <CompareArrowsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" fontWeight="bold">
          Popular Pairs
        </Typography>
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
      
      <Grid container spacing={2}>
        {popularPairs.map((pair, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              onClick={() => handlePairClick(pair)}
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: 3,
                transition: 'transform 0.2s',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img 
                      src={pair.fromToken.logoURI} 
                      alt={pair.fromToken.name} 
                      style={{ width: 32, height: 32, borderRadius: '50%', zIndex: 1 }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                      }}
                    />
                    <img 
                      src={pair.toToken.logoURI} 
                      alt={pair.toToken.name} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        marginLeft: -8,
                        border: `2px solid ${theme.palette.background.paper}`,
                        zIndex: 0
                      }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                      }}
                    />
                  </Box>
                  <Typography variant="body1" fontWeight="bold" sx={{ ml: 1 }}>
                    {pair.fromToken.symbol}/{pair.toToken.symbol}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    24h Volume
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatVolume(pair.volume24h)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    24h Change
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {pair.priceChange24h > 0 ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
                    ) : (
                      <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5, fontSize: 16 }} />
                    )}
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color={pair.priceChange24h > 0 ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(pair.priceChange24h).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default PopularPairs;
