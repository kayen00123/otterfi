import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  useTheme,
  Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Header from './Header';

// Token cache to avoid repeated API calls
const tokenInfoCache = {};

// Add this at the top of your file, after the tokenInfoCache declaration
const KNOWN_TOKEN_DECIMALS = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 6, // WIF
  'F3nefJBcejYbtdREjui1T9DPh5dBgpkKq7u2GAAMXs5B': 6, // WIF (alternate)
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6  // JUP
};

const LimitOrderHistory = () => {
  const theme = useTheme();
  const { connected, publicKey, sendTransaction } = useWallet();
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Create a connection to Solana
  const connection = new Connection(
    'https://mainnet.helius-rpc.com/?api-key=887a40ac-2f47-4df7-bc37-1b9589ba5a48',
    {
      wsEndpoint: 'wss://mainnet.helius-rpc.com/?api-key=887a40ac-2f47-4df7-bc37-1b9589ba5a48',
      commitment: 'processed'
    }
  );
  
  // Helper function to get token info with caching
  const getTokenInfo = async (mintAddress) => {
    // Check cache first
    if (tokenInfoCache[mintAddress]) {
      return tokenInfoCache[mintAddress];
    }
    
    try {
      // Try GeckoTerminal API first
      const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mintAddress}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.attributes) {
          const tokenData = data.data.attributes;
          const result = {
            symbol: tokenData.symbol.toUpperCase(),
            name: tokenData.name,
            logo: tokenData.image_url,
            decimals: KNOWN_TOKEN_DECIMALS[mintAddress] || 9 // Use known decimals if available
          };
          
          // Cache the result
          tokenInfoCache[mintAddress] = result;
          return result;
        }
      }
      
      // Fallback to Jupiter API
      const jupiterResponse = await fetch('https://cache.jup.ag/tokens');
      const jupiterTokens = await jupiterResponse.json();
      const jupiterToken = jupiterTokens.find(t => t.address === mintAddress);
      
      if (jupiterToken) {
        const result = {
          symbol: jupiterToken.symbol,
          name: jupiterToken.name,
          logo: jupiterToken.logoURI,
          decimals: jupiterToken.decimals
        };
        
        // Cache the result
        tokenInfoCache[mintAddress] = result;
        return result;
      }
      
      // If all else fails, return default values
      return { 
        symbol: 'Unknown', 
        name: 'Unknown Token', 
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        decimals: KNOWN_TOKEN_DECIMALS[mintAddress] || 9
      };
    } catch (error) {
      console.error(`Error fetching token info for ${mintAddress}:`, error);
      return { 
        symbol: 'Unknown', 
        name: 'Unknown Token', 
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        decimals: KNOWN_TOKEN_DECIMALS[mintAddress] || 9
      };
    }
  };
  
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
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 0.01 ? 6 : 2
    }).format(value);
  };

  // Calculate time remaining for order expiration
  const calculateTimeRemaining = (createdAtTimestamp) => {
    if (!createdAtTimestamp) return null;
    
    // Default expiration is 7 days from creation
    const expirationTime = new Date(createdAtTimestamp);
    expirationTime.setDate(expirationTime.getDate() + 7);
    
    const now = new Date();
    const timeRemaining = expirationTime - now;
    
    if (timeRemaining <= 0) {
      return "Expired";
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };
  
  const fetchOrders = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    try {
      // Fetch active orders
      const activeResponse = await fetch(`https://api.jup.ag/limit/v2/openOrders?wallet=${publicKey.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Fetch order history
      const historyResponse = await fetch(`https://api.jup.ag/limit/v2/orderHistory?wallet=${publicKey.toString()}&page=1`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!activeResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const activeData = await activeResponse.json();
      const historyData = await historyResponse.json();

      // Handle different response formats - activeData might be an array directly
      const activeOrders = Array.isArray(activeData) ? activeData : (activeData?.orders || []);
      const historyOrders = historyData?.orders || [];

      // Add more detailed logging
      console.log('Active orders raw data:', activeData);
      console.log('Active orders array:', activeOrders);
      console.log('Active orders count:', activeOrders.length);
      console.log('Order history count:', historyOrders.length);

      // Collect all unique token mints to fetch their info
      const allMints = new Set();
      
      // Add mints from active orders
      activeOrders.forEach(order => {
        if (order.account && order.account.inputMint) allMints.add(order.account.inputMint);
        if (order.account && order.account.outputMint) allMints.add(order.account.outputMint);
      });
      
      // Add mints from history orders
      historyOrders.forEach(order => {
        if (order.inputMint) allMints.add(order.inputMint);
        if (order.outputMint) allMints.add(order.outputMint);
      });
      
      // Fetch token info for all mints
      const tokenInfoMap = {};
      await Promise.all([...allMints].map(async (mint) => {
        tokenInfoMap[mint] = await getTokenInfo(mint);
      }));
      
      // Process active orders with more error handling
      const enrichedActiveOrders = activeOrders.map(order => {
        try {
          if (!order.account) {
            console.error('Order missing account property:', order);
            return null;
          }
          
          const inputTokenInfo = tokenInfoMap[order.account.inputMint] || { symbol: 'Unknown', name: 'Unknown Token' };
          const outputTokenInfo = tokenInfoMap[order.account.outputMint] || { symbol: 'Unknown', name: 'Unknown Token' };
          
          console.log('Processing active order:', order.publicKey);
          
          // Use our known decimals dictionary for common tokens
          const makingDecimals = KNOWN_TOKEN_DECIMALS[order.account.inputMint] !== undefined 
            ? KNOWN_TOKEN_DECIMALS[order.account.inputMint] 
            : inputTokenInfo.decimals || 9;
                             
          const takingDecimals = KNOWN_TOKEN_DECIMALS[order.account.outputMint] !== undefined 
            ? KNOWN_TOKEN_DECIMALS[order.account.outputMint] 
            : outputTokenInfo.decimals || 9;
          
          // Parse amounts with proper decimal handling
          const makingAmount = parseInt(order.account.makingAmount) / Math.pow(10, makingDecimals);
          const takingAmount = parseInt(order.account.takingAmount) / Math.pow(10, takingDecimals);
          
          console.log('Processed amounts for order', order.publicKey, {
            makingAmount,
            takingAmount,
            makingDecimals,
            takingDecimals
          });
          
          // Calculate price per token correctly
          const limitPrice = takingAmount / makingAmount;
          
          console.log('Calculated limit price:', limitPrice);
          
          // Handle date properly
          let createdAtFormatted = 'Pending';
          let createdAtTimestamp = null;
          try {
            if (order.account.createdAt) {
              // Check if createdAt is a timestamp or ISO string
              if (typeof order.account.createdAt === 'string' && order.account.createdAt.includes('T')) {
                // It's an ISO string
                createdAtTimestamp = new Date(order.account.createdAt);
                createdAtFormatted = createdAtTimestamp.toLocaleString();
              } else {
                // It's a timestamp
                createdAtTimestamp = new Date(parseInt(order.account.createdAt) * 1000);
                createdAtFormatted = createdAtTimestamp.toLocaleString();
              }
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
          
          // Calculate time remaining until expiration (7 days from creation)
          const timeRemaining = calculateTimeRemaining(createdAtTimestamp);
          
          return {
            id: order.publicKey,
            inputToken: {
              address: order.account.inputMint,
              symbol: inputTokenInfo.symbol,
              name: inputTokenInfo.name,
              logo: inputTokenInfo.logo,
              decimals: makingDecimals
            },
            outputToken: {
              address: order.account.outputMint,
              symbol: outputTokenInfo.symbol,
              name: outputTokenInfo.name,
              logo: outputTokenInfo.logo,
              decimals: takingDecimals
            },
            limitPrice: limitPrice,
            makingAmount: makingAmount,
            takingAmount: takingAmount,
            createdAt: createdAtFormatted,
            createdAtTimestamp: createdAtTimestamp,
            timeRemaining: timeRemaining,
            status: 'OPEN',
            txid: order.txid || ''
          };
        } catch (err) {
          console.error('Error processing active order:', order.publicKey, err);
          // Return a placeholder order so we don't lose it completely
          return {
            id: order.publicKey || 'unknown',
            inputToken: {
              address: order.account?.inputMint || 'Unknown',
              symbol: 'Error',
              name: 'Error processing order',
              logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
              decimals: 9
            },
            outputToken: {
              address: order.account?.outputMint || 'Unknown',
              symbol: 'Error',
              name: 'Error processing order',
              logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
              decimals: 9
            },
            limitPrice: 0,
            makingAmount: 0,
            takingAmount: 0,
            createdAt: 'Error',
            createdAtTimestamp: null,
            timeRemaining: null,
            status: 'OPEN',
            txid: order.txid || '',
            error: true
          };
        }
      }).filter(order => order !== null);
      
      // Process completed orders
      const enrichedCompletedOrders = historyOrders.map(order => {
        try {
          const inputTokenInfo = tokenInfoMap[order.inputMint] || { symbol: 'Unknown', name: 'Unknown Token' };
          const outputTokenInfo = tokenInfoMap[order.outputMint] || { symbol: 'Unknown', name: 'Unknown Token' };
          
          // Use our known decimals dictionary for common tokens
          const inputDecimals = KNOWN_TOKEN_DECIMALS[order.inputMint] !== undefined 
            ? KNOWN_TOKEN_DECIMALS[order.inputMint] 
            : inputTokenInfo.decimals || 9;
                             
          const outputDecimals = KNOWN_TOKEN_DECIMALS[order.outputMint] !== undefined 
            ? KNOWN_TOKEN_DECIMALS[order.outputMint] 
            : outputTokenInfo.decimals || 9;
          
          const makingAmount = parseFloat(order.makingAmount) || 0;
          const takingAmount = parseFloat(order.takingAmount) || 0;
          
          // Calculate price per token correctly
          const limitPrice = takingAmount / makingAmount;
          
          // Parse the created date
          let createdAtDate = null;
          try {
            createdAtDate = order.createdAt ? new Date(order.createdAt) : null;
          } catch (e) {
            console.error('Error parsing date:', e);
          }
          
          return {
            id: order.orderKey, // Use orderKey as the unique identifier
            inputToken: {
              address: order.inputMint,
              symbol: inputTokenInfo.symbol,
              name: inputTokenInfo.name,
              logo: inputTokenInfo.logo,
              decimals: inputDecimals
            },
            outputToken: {
              address: order.outputMint,
              symbol: outputTokenInfo.symbol,
              name: outputTokenInfo.name,
              logo: outputTokenInfo.logo,
              decimals: outputDecimals
            },
            limitPrice: limitPrice,
            makingAmount: makingAmount,
            takingAmount: takingAmount,
            createdAt: createdAtDate ? createdAtDate.toLocaleString() : 'Unknown',
            createdAtTimestamp: createdAtDate,
            timeRemaining: null, // Completed orders don't have remaining time
            status: order.status === 'Completed' ? 'FILLED' : 'CANCELLED',
            txid: order.openTx || order.closeTx || ''
          };
        } catch (err) {
          console.error('Error processing completed order:', order.orderKey, err);
          return null;
        }
      }).filter(order => order !== null);
      
      setActiveOrders(enrichedActiveOrders);
      setCompletedOrders(enrichedCompletedOrders);
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      setError('Failed to fetch your limit orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);
  
  useEffect(() => {
    fetchOrders();
    
    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(() => {
      if (connected && publicKey) {
        fetchOrders();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchOrders, connected, publicKey]);
  
  const cancelOrder = async (orderPublicKey) => {
    if (!connected || !publicKey) return;
    
    setCancellingOrder(orderPublicKey);
    try {
      const response = await fetch('https://api.jup.ag/limit/v2/cancelOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maker: publicKey.toString(),
          orders: [orderPublicKey],
          computeUnitPrice: "auto"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }
      
      const data = await response.json();
      console.log('Cancel order response:', data);
      
      // Check if we have a valid transaction
      if (!data.txs || !data.txs[0]) {
        throw new Error('No transaction data received from API');
      }
      
      // Deserialize the transaction
      const transaction = VersionedTransaction.deserialize(Buffer.from(data.txs[0], 'base64'));
      
      // Check which wallet is connected and use the appropriate method
      let signature;
      
      // Check if we're using Phantom specifically
      const isPhantomWallet = window.phantom && window.phantom.solana && window.phantom.solana.isConnected;
      
      if (isPhantomWallet) {
        // Use Phantom's native method
        console.log('Using Phantom native signAndSendTransaction');
        const result = await window.phantom.solana.signAndSendTransaction(transaction);
        signature = result.signature; // Extract the signature from the response
      } else {
        // For all other wallets, use the wallet adapter
        console.log('Using wallet adapter for non-Phantom wallet');
        signature = await sendTransaction(transaction, connection);
      }
      
      console.log('Cancel transaction sent with signature:', signature);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      setSuccess(true);
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError(`Failed to cancel order: ${error.message}`);
    } finally {
      setCancellingOrder(null);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'primary';
      case 'FILLED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Combine active and completed orders for display
  const allOrders = [...activeOrders, ...completedOrders];
  
  if (!connected) {
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
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 4,
                width: '100%',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
                Limit Orders
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please connect your wallet to view your limit orders.
              </Typography>
              
              <Button 
                component={Link} 
                to="/swap"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{ mr: 2 }}
              >
                Back to Swap
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Limit Orders
            </Typography>
            
            <Box>
              <Button 
                startIcon={<RefreshIcon />}
                onClick={fetchOrders}
                disabled={loading}
                variant="outlined"
                sx={{ mr: 2, borderRadius: 2 }}
              >
                Refresh
              </Button>
              
              <Button 
                component={Link} 
                to="/swap"
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                New Order
              </Button>
            </Box>
          </Box>
          
          {loading && allOrders.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Pair
                          <Tooltip title="Trading pair for this limit order">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Side
                          <Tooltip title="Whether you're selling or buying the base token">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Amount
                          <Tooltip title="The amount of tokens you're selling">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Limit Price
                          <Tooltip title="The price per token at which your order will execute">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Total
                          <Tooltip title="The total amount you'll receive if the order is filled">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Date
                          <Tooltip title="When this order was created">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Expires In
                          <Tooltip title="Time remaining until order expires (7 days from creation)">
                            <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allOrders.length > 0 ? (
                      allOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ position: 'relative' }}>
                                <Avatar 
                                  src={order.inputToken.logo} 
                                  alt={order.inputToken.symbol}
                                  sx={{ width: 24, height: 24 }}
                                />
                                <Avatar 
                                  src={order.outputToken.logo} 
                                  alt={order.outputToken.symbol}
                                  sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    position: 'absolute',
                                    left: 12,
                                    top: -6
                                  }}
                                />
                              </Box>
                              <Typography sx={{ ml: 2 }}>
                                {order.inputToken.symbol}/{order.outputToken.symbol}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="SELL" 
                              size="small"
                              sx={{ 
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(244, 67, 54, 0.2)' 
                                  : 'rgba(244, 67, 54, 0.1)',
                                color: 'error.main',
                                fontWeight: 'bold',
                                borderRadius: '4px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`${order.makingAmount.toFixed(6)} ${order.inputToken.symbol}`}>
                              <Typography>
                                {formatCurrency(order.makingAmount)} {order.inputToken.symbol}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`1 ${order.inputToken.symbol} = ${order.limitPrice.toFixed(6)} ${order.outputToken.symbol}`}>
                              <Typography>
                                {formatCurrency(order.limitPrice)} {order.outputToken.symbol}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`${order.takingAmount.toFixed(6)} ${order.outputToken.symbol}`}>
                              <Typography>
                                {formatCurrency(order.takingAmount)} {order.outputToken.symbol}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{order.createdAt}</TableCell>
                          <TableCell>
                            {order.status === 'OPEN' && order.timeRemaining ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {order.timeRemaining}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {order.status === 'OPEN' ? 'Unknown' : '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status)}
                              size="small"
                              sx={{ borderRadius: '4px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex' }}>
                              {order.status === 'OPEN' && (
                                <Tooltip title="Cancel Order">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => cancelOrder(order.id)}
                                    disabled={cancellingOrder === order.id}
                                  >
                                    {cancellingOrder === order.id ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <DeleteOutlineIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {order.txid && (
                                <Tooltip title="View on Explorer">
                                  <IconButton 
                                    size="small"
                                    component="a"
                                    href={`https://solscan.io/tx/${order.txid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <OpenInNewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No limit orders found. Create a new limit order to get started.
                          </Typography>
                          <Button 
                            component={Link} 
                            to="/swap"
                            variant="contained"
                            sx={{ mt: 2, borderRadius: 2 }}
                          >
                            Create Limit Order
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Container>
      
      {/* Success notification */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Order cancelled successfully!
        </Alert>
      </Snackbar>
      
      {/* Error notification */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LimitOrderHistory;





