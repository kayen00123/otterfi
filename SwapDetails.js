import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Collapse, 
  IconButton, 
  Divider,
  useTheme,
  Tooltip,
  Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

const SwapDetails = ({ 
  fromToken, 
  toToken, 
  exchangeRate, 
  priceImpact, 
  slippage,
  networkFee = 0.000005, // SOL
  route = [],
  markets = []
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Format market name for display
  const formatMarketName = (marketName) => {
    // Common market names to make more readable
    const marketMap = {
      'Orca (Whirlpools)': 'Orca',
      'Raydium (CLMM)': 'Raydium',
      'Jupiter Limit Order': 'Jupiter',
      'Meteora': 'Meteora',
      'Openbook': 'Openbook'
    };
    
    return marketMap[marketName] || marketName;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1.5,
        mb: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* Summary row with expand/collapse control */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" color="text.secondary">
          Swap Details
        </Typography>
        <IconButton 
          size="small" 
          sx={{ p: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {/* Always visible summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Rate
        </Typography>
        <Typography variant="body2">
          1 {fromToken?.symbol} ≈ {exchangeRate?.toFixed(6)} {toToken?.symbol}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Fee
          </Typography>
          <Tooltip title="0.2% platform fee">
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
          </Tooltip>
        </Box>
        <Typography variant="body2">
          0.2%
        </Typography>
      </Box>

      {/* Expandable details */}
      <Collapse in={expanded} timeout="auto">
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Price Impact
            </Typography>
            <Tooltip title="The difference between the market price and estimated price due to trade size">
              <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            </Tooltip>
          </Box>
          <Typography
            variant="body2"
            color={priceImpact > 1 ? 'error' : 'success.main'}
          >
            {priceImpact?.toFixed(2)}%
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Slippage Tolerance
            </Typography>
            <Tooltip title="Maximum price difference between when your order is submitted and when it is executed">
              <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            </Tooltip>
          </Box>
          <Typography variant="body2">
            {slippage}%
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Network Fee
            </Typography>
            <Tooltip title="Estimated Solana network fee for this transaction">
              <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            </Tooltip>
          </Box>
          <Typography variant="body2">
            ~{networkFee} SOL
          </Typography>
        </Box>
        
        {/* Route information */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Route
          </Typography>
          
          {route && route.length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: 0.5,
              mt: 1
            }}>
              {route.map((token, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ArrowRightAltIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                  <Chip 
                    label={token} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: '16px',
                      height: '24px',
                      fontSize: '0.75rem'
                    }}
                  />
                </React.Fragment>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Direct swap
            </Typography>
          )}
        </Box>
        
        {/* Markets used */}
        {markets && markets.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Markets
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {markets.map((market, index) => (
                <Chip 
                  key={index}
                  label={formatMarketName(market)} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderRadius: '16px',
                    height: '24px',
                    fontSize: '0.75rem',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.05)'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default SwapDetails;
