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
  Button,
  useTheme
} from '@mui/material';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NewTokens = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [newTokens, setNewTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const limit = 5; // Number of tokens per page
  
  useEffect(() => {
    const fetchNewTokens = async () => {
      try {
        // Fetch new tokens with pagination
        const response = await fetch(`https://api.jup.ag/tokens/v1/new?limit=${limit}&offset=${page * limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch new tokens');
        }
        
        const data = await response.json();
        setNewTokens(data);
      } catch (error) {
        console.error('Error fetching new tokens:', error);
        setError('Failed to load new tokens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewTokens();
  }, [page]);
  
  const handleTokenClick = (token) => {
    // Navigate to swap page with this token pre-selected
    navigate('/swap', { state: { fromToken: token } });
  };
  
  const formatCreatedAt = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Convert Unix timestamp to Date object
      const date = new Date(parseInt(timestamp) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
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
        <FiberNewIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" fontWeight="bold">
          New Tokens
        </Typography>
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell align="right">Created</TableCell>
              <TableCell align="right">Markets</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newTokens.map((token) => (
              <TableRow 
                key={token.mint}
                onClick={() => handleTokenClick({
                  address: token.mint,
                  symbol: token.symbol,
                  name: token.name,
                  decimals: token.decimals,
                  logoURI: token.logo_uri
                })}
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
                  {formatCreatedAt(token.created_at)}
                </TableCell>
                <TableCell align="right">
                  {token.known_markets ? token.known_markets.length : 0}
                </TableCell>
              </TableRow>
            ))}
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
    </Paper>
  );
};

export default NewTokens;
