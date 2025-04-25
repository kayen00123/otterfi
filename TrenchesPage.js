import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
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
  Tooltip,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Divider,
  Link,
  useTheme
} from '@mui/material';
import Header from '../components/Header';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

const TrenchesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State for trending tokens
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);
  
  // State for new tokens
  const [newTokens, setNewTokens] = useState([]);
  const [newLoading, setNewLoading] = useState(true);
  const [newError, setNewError] = useState(null);
  const [page, setPage] = useState(0);
  const limit = 10; // Number of tokens per page
  
  // State for token prices
  const [tokenPrices, setTokenPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(true);
  
  // State for token info dialog
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenInfoOpen, setTokenInfoOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Fetch trending tokens
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        // First try to fetch verified tokens and sort by volume
        const response = await fetch('https://api.jup.ag/tokens/v1/tagged/verified');
        
        if (!response.ok) {
          throw new Error('Failed to fetch verified tokens');
        }
        
        const data = await response.json();
        
        // Sort by daily volume and get top tokens
        const sortedTokens = data
          .filter(token => token.daily_volume)
          .sort((a, b) => (b.daily_volume || 0) - (a.daily_volume || 0))
          .slice(0, 20);
        
        setTrendingTokens(sortedTokens);
        
        // Collect token addresses for price fetching
        return sortedTokens.map(token => token.address);
      } catch (error) {
        console.error('Error fetching trending tokens:', error);
        setTrendingError('Failed to load trending tokens');
        return [];
      } finally {
        setTrendingLoading(false);
      }
    };
    
    fetchTrendingTokens().then(addresses => {
      if (addresses.length > 0) {
        fetchTokenPrices(addresses);
      }
    });
  }, []);
  
  // Fetch new tokens
  const fetchNewTokens = useCallback(async () => {
    setNewLoading(true);
    try {
      // Fetch new tokens with pagination
      const response = await fetch(`https://api.jup.ag/tokens/v1/new?limit=${limit}&offset=${page * limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch new tokens');
      }
      
      const data = await response.json();
      setNewTokens(data);
      
      // Collect token addresses for price fetching
      return data.map(token => token.mint);
    } catch (error) {
      console.error('Error fetching new tokens:', error);
      setNewError('Failed to load new tokens');
      return [];
    } finally {
      setNewLoading(false);
    }
  }, [page, limit]);
  
  useEffect(() => {
    fetchNewTokens().then(addresses => {
      if (addresses.length > 0) {
        fetchTokenPrices(addresses);
      }
    });
  }, [fetchNewTokens]);
  
  // Refresh new tokens
  const handleRefreshNewTokens = () => {
    // Reset page to 0 to get the newest tokens
    setPage(0);
    fetchNewTokens().then(addresses => {
      if (addresses.length > 0) {
        fetchTokenPrices(addresses);
      }
    });
  };
  
  // Fetch token prices using Jupiter's price API
  const fetchTokenPrices = async (addresses) => {
    try {
      setPriceLoading(true);
      
      // Batch addresses into groups of 100 to avoid URL length limits
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        batches.push(addresses.slice(i, i + batchSize));
      }
      
      // Fetch prices for each batch
      const pricePromises = batches.map(batch => {
        const idsParam = batch.join(',');
        return fetch(`https://api.jup.ag/price/v2?ids=${idsParam}`);
      });
      
      const responses = await Promise.all(pricePromises);
      
      // Process all responses
      const priceData = {};
      
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Merge price data
            Object.assign(priceData, data.data);
          }
        }
      }
      
      setTokenPrices(priceData);
    } catch (error) {
      console.error('Error fetching token prices:', error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  // Set up interval to refresh prices
  useEffect(() => {
    // Get all token addresses
    const getAllAddresses = () => {
      const trendingAddresses = trendingTokens.map(token => token.address);
      const newAddresses = newTokens.map(token => token.mint);
      return [...new Set([...trendingAddresses, ...newAddresses])];
    };
    
    // Initial fetch
    const addresses = getAllAddresses();
    if (addresses.length > 0) {
      fetchTokenPrices(addresses);
    }
    
    // Set up interval for refreshing prices every 30 seconds
    const interval = setInterval(() => {
      const currentAddresses = getAllAddresses();
      if (currentAddresses.length > 0) {
        fetchTokenPrices(currentAddresses);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [trendingTokens, newTokens]);
  
  const handleTokenClick = (token) => {
    // Navigate to swap page with this token pre-selected
    navigate('/swap', { state: { fromToken: token } });
  };
  
  const handleNewTokenClick = (token) => {
    // Show token info dialog
    setSelectedToken({
      ...token,
      price: getTokenPrice(token.mint)
    });
    setTokenInfoOpen(true);
  };
  
  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };
  
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined || isNaN(Number(volume))) {
      return 'N/A';
    }
    
    const numVolume = Number(volume);
    
    if (numVolume >= 1000000000) {
      return `$${(numVolume / 1000000000).toFixed(2)}B`;
    } else if (numVolume >= 1000000) {
      return `$${(numVolume / 1000000).toFixed(2)}M`;
    } else if (numVolume >= 1000) {
      return `$${(numVolume / 1000).toFixed(2)}K`;
    } else {
      return `$${numVolume.toFixed(2)}`;
    }
  };
  
  const formatPrice = (price) => {
    // Check if price is null, undefined, or not a number
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'N/A';
    }
    
    // Convert to number to ensure we can use toFixed
    const numPrice = Number(price);
    
    if (numPrice < 0.000001) {
      return `$${numPrice.toExponential(4)}`;
    } else if (numPrice < 0.01) {
      return `$${numPrice.toFixed(6)}`;
    } else if (numPrice < 1) {
      return `$${numPrice.toFixed(4)}`;
    } else if (numPrice < 10000) {
      return `$${numPrice.toFixed(2)}`;
    } else {
      return `$${numPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
  };
  
  const formatPriceChange = (change) => {
    if (change === null || change === undefined || isNaN(Number(change))) {
      return 'N/A';
    }
    
    const numChange = Number(change);
    return `${numChange > 0 ? '+' : ''}${numChange.toFixed(2)}%`;
  };
  
  const formatCreatedAt = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Convert Unix timestamp to Date object
      const date = new Date(parseInt(timestamp) * 1000);
      return new Date(date).toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };
  
  const getTokenPrice = (address) => {
    if (!tokenPrices || !tokenPrices[address] || tokenPrices[address].price === undefined) {
      return null;
    }
    return Number(tokenPrices[address].price);
  };
  
  const getTokenPriceChange = (address) => {
    if (!tokenPrices || !tokenPrices[address] || tokenPrices[address].price_24h_change_percentage === undefined) {
      return null;
    }
    return Number(tokenPrices[address].price_24h_change_percentage);
  };
  
  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Trenches
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Discover trending tokens and new opportunities on Solana
          </Typography>
          
          <Grid container spacing={3}>
            {/* Trending Tokens Section */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  height: '100%',
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
                  {trendingError && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {trendingError}
                    </Typography>
                  )}
                </Box>
                
                {trendingLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Token</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">24h Change</TableCell>
                          <TableCell align="right">24h Volume</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trendingTokens.map((token) => {
                          const price = getTokenPrice(token.address);
                          const priceChange = getTokenPriceChange(token.address);
                          
                          return (
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
                                {priceLoading && price === null ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Typography variant="body2">
                                    {formatPrice(price)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {priceLoading && priceChange === null ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {Number(priceChange) > 0 ? (
                                      <TrendingUpOutlinedIcon 
                                        fontSize="small" 
                                        sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} 
                                      />
                                    ) : Number(priceChange) < 0 ? (
                                      <TrendingDownOutlinedIcon 
                                        fontSize="small" 
                                        sx={{ color: 'error.main', mr: 0.5, fontSize: 16 }} 
                                      />
                                    ) : null}
                                    <Typography 
                                      variant="body2" 
                                      color={
                                        Number(priceChange) > 0 ? 'success.main' : 
                                        Number(priceChange) < 0 ? 'error.main' : 
                                        'text.primary'
                                      }
                                    >
                                      {formatPriceChange(priceChange)}
                                    </Typography>
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {formatVolume(token.daily_volume)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
            
            {/* New Tokens Section */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  height: '100%',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FiberNewIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      New Tokens
                    </Typography>
                    {newError && (
                      <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                        {newError}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Refresh button for new tokens */}
                  <Tooltip title="Refresh new tokens">
                    <IconButton 
                      onClick={handleRefreshNewTokens} 
                      disabled={newLoading}
                      color="primary"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {newLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Token</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Contract</TableCell>
                            <TableCell align="right">Created</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {newTokens.map((token) => {
                            const price = getTokenPrice(token.mint);
                            
                            return (
                              <TableRow 
                                key={token.mint}
                                onClick={() => handleNewTokenClick(token)}
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
                                      src={token.logo_uri} 
                                      alt={token.name} 
                                      style={{ width: 24, height: 24, borderRadius: '50%' }} 
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                                      }}
                                    />
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {token.symbol}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {token.name}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  {priceLoading && price === null ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Typography variant="body2">
                                      {formatPrice(price)}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Tooltip title={token.mint}>
                                    <Typography variant="body2">
                                      {formatAddress(token.mint)}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="right">
                                  {formatCreatedAt(token.created_at)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button 
                        disabled={page === 0} 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        variant="outlined"
                        size="small"
                      >
                        Previous
                      </Button>
                      <Button 
                        onClick={() => setPage(p => p + 1)}
                        variant="outlined"
                        size="small"
                      >
                        Next
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
      
      {/* Token Info Dialog */}
      <Dialog 
        open={tokenInfoOpen} 
        onClose={() => setTokenInfoOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1
          }
        }}
      >
        {selectedToken && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img 
                  src={selectedToken.logo_uri} 
                  alt={selectedToken.name} 
                  style={{ width: 40, height: 40, borderRadius: '50%' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedToken.name} ({selectedToken.symbol})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Token
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contract Address
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={selectedToken.mint}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={copiedAddress ? "Copied!" : "Copy address"}>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleCopyAddress(selectedToken.mint)}
                            size="small"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View on Explorer">
                          <IconButton 
                            edge="end" 
                            component="a"
                            href={`https://solscan.io/token/${selectedToken.mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                    }
                  }}
                />
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Price
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(selectedToken.price)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatCreatedAt(selectedToken.created_at)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Token Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Symbol
                  </Typography>
                  <Typography variant="body1">
                    {selectedToken.symbol}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Decimals
                  </Typography>
                  <Typography variant="body1">
                    {selectedToken.decimals}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedToken.known_markets && selectedToken.known_markets.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Available Markets
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedToken.known_markets.map((market, index) => (
                      <Chip 
                        key={index}
                        label={market}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={() => setTokenInfoOpen(false)}
                variant="outlined"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  handleTokenClick({
                    address: selectedToken.mint,
                    symbol: selectedToken.symbol,
                    name: selectedToken.name,
                    decimals: selectedToken.decimals,
                    logoURI: selectedToken.logo_uri
                  });
                  setTokenInfoOpen(false);
                }}
                variant="contained"
                color="primary"
              >
                Trade This Token
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TrenchesPage;


