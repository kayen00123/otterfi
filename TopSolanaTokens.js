import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress, 
  useTheme, Card, CardContent, Skeleton
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const TopSolanaTokens = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState([]);
  const [error, setError] = useState(null);

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    
    // For large numbers, use K, M, B suffixes
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 0.01 ? 6 : 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch trending tokens from CoinGecko
        const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
        
        if (!trendingResponse.ok) {
          throw new Error(`CoinGecko API returned ${trendingResponse.status}`);
        }
        
        const trendingData = await trendingResponse.json();
        
        // Filter for Solana tokens (platform: "solana")
        const solanaTokens = trendingData.coins
          .filter(item => {
            // Check if it's a Solana token or has Solana in the name/symbol
            return (
              item.item.platforms && 
              (item.item.platforms.solana || 
               item.item.name.toLowerCase().includes('solana') ||
               item.item.symbol.toLowerCase().includes('sol'))
            );
          })
          .map(item => item.item);
        
        // If we don't have enough Solana tokens, include some other trending tokens
        let finalTokens = solanaTokens;
        if (solanaTokens.length < 5) {
          const otherTokens = trendingData.coins
            .filter(item => !solanaTokens.includes(item.item))
            .map(item => item.item)
            .slice(0, 10 - solanaTokens.length);
          
          finalTokens = [...solanaTokens, ...otherTokens];
        }
        
        // Fetch detailed data for each token
        const tokenDetailsPromises = finalTokens.map(token => 
          fetch(`https://api.coingecko.com/api/v3/coins/${token.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`API returned ${res.status} for ${token.id}`);
              }
              return res.json();
            })
            .catch(err => {
              console.error(`Error fetching data for ${token.id}:`, err);
              return null;
            })
        );
        
        const tokenDetailsResults = await Promise.all(tokenDetailsPromises);
        
        // Process and format the token data
        const processedTokens = tokenDetailsResults
          .filter(token => token !== null)
          .map(token => {
            // Extract price history from sparkline data if available
            const priceHistory = token.market_data?.sparkline_7d?.price || [];
            
            // Calculate price change from history if available
            let priceChange = 0;
            if (priceHistory && priceHistory.length >= 2) {
              const oldestPrice = priceHistory[0];
              const newestPrice = priceHistory[priceHistory.length - 1];
              priceChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
            }
            
            return {
              id: token.id,
              symbol: token.symbol.toUpperCase(),
              name: token.name,
              price: token.market_data?.current_price?.usd || 0,
              priceChange24h: token.market_data?.price_change_percentage_24h || 0,
              priceChange7d: token.market_data?.price_change_percentage_7d || priceChange,
              volume24h: token.market_data?.total_volume?.usd || 0,
              marketCap: token.market_data?.market_cap?.usd || 0,
              image: token.image?.small || null,
              history: priceHistory.map((price, index) => ({
                timestamp: Date.now() - (priceHistory.length - index) * 3600000, // Approximate timestamp
                price: price
              }))
            };
          })
          .sort((a, b) => b.marketCap - a.marketCap); // Sort by market cap
        
        setTokenData(processedTokens);
      } catch (error) {
        console.error('Error fetching trending tokens:', error);
        setError('Failed to load trending tokens data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingTokens();
  }, []);

  // Prepare chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    elements: {
      point: {
        radius: 0
      },
      line: {
        tension: 0.4,
        borderWidth: 2
      }
    }
  };

  return (
    <Box sx={{ mt: 6, mb: 8 }}>
      <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
        Trending Tokens
      </Typography>
      
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(10)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box>
                      <Skeleton variant="text" width={80} />
                      <Skeleton variant="text" width={120} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 4,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)',
            textAlign: 'center'
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {tokenData.slice(0, 10).map((token) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={token.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
                      : '0 8px 16px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={token.image || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'} 
                        alt={token.name} 
                        style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                        }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">{token.symbol}</Typography>
                        <Typography variant="body2" color="text.secondary">{token.name}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {token.priceChange24h > 0 ? (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20, mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20, mr: 0.5 }} />
                      )}
                      <Typography 
                        variant="body2" 
                        color={token.priceChange24h > 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(token.priceChange24h)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(token.price)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Vol: {formatCurrency(token.volume24h)}
                  </Typography>
                  
                  {token.history && token.history.length > 0 && (
                    <Box sx={{ height: 60 }}>
                      <Line 
                        data={{
                          labels: token.history.map(point => new Date(point.timestamp).toLocaleDateString()),
                          datasets: [
                            {
                              data: token.history.map(point => point.price),
                              borderColor: token.priceChange7d >= 0 ? '#4CAF50' : '#F44336',
                              backgroundColor: token.priceChange7d >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                              fill: true
                            }
                          ]
                        }} 
                        options={chartOptions} 
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TopSolanaTokens;
