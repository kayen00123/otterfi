import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  Button, 
  Box, 
  Typography, 
  Menu, 
  MenuItem, 
  Divider, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Tooltip,
  CircularProgress,
  IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ImageIcon from '@mui/icons-material/Image';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WaterIcon from '@mui/icons-material/Water';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Connection, PublicKey } from '@solana/web3.js';

// Cache for transaction history to avoid repeated fetching
const txCache = new Map();

// Cache for token info to avoid repeated API calls
const tokenInfoCache = new Map();

// Function to fetch token info
const fetchTokenInfo = async (mintAddress) => {
  try {
    // Check cache first
    if (tokenInfoCache.has(mintAddress)) {
      return tokenInfoCache.get(mintAddress);
    }
    
    // Special case for SOL
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      const solInfo = {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
      };
      tokenInfoCache.set(mintAddress, solInfo);
      return solInfo;
    }
    
    // Try Jupiter API first
    try {
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
        tokenInfoCache.set(mintAddress, result);
        return result;
      }
    } catch (jupiterError) {
      console.error('Error fetching from Jupiter:', jupiterError);
    }
    
    // If not found in Jupiter, try GeckoTerminal API
    try {
      const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mintAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.attributes) {
          const tokenData = data.data.attributes;
          const result = {
            symbol: tokenData.symbol.toUpperCase(),
            name: tokenData.name,
            logo: tokenData.image_url,
            decimals: tokenData.decimals || 9
          };
          
          // Cache the result
          tokenInfoCache.set(mintAddress, result);
          return result;
        }
      }
    } catch (geckoError) {
      console.error('Error fetching from GeckoTerminal:', geckoError);
    }
    
    // If all else fails, return default values
    const defaultResult = { 
      symbol: mintAddress.slice(0, 4) + '...',
      name: 'Unknown Token', 
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
      decimals: 9
    };
    
    // Cache the result
    tokenInfoCache.set(mintAddress, defaultResult);
    return defaultResult;
  } catch (error) {
    console.error(`Error fetching token info for ${mintAddress}:`, error);
    return { 
      symbol: mintAddress.slice(0, 4) + '...',
      name: 'Unknown Token', 
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
      decimals: 9
    };
  }
};

const WalletConnectButton = (props) => {
  const { connected, publicKey, disconnect } = useWallet();
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const open = Boolean(anchorEl);

  // Update the parseTransactionDetails function to show more detailed swap information
  const parseTransactionDetails = async (transaction, signature) => {
    try {
      // If transaction is null or meta is missing, return basic info
      if (!transaction || !transaction.meta) {
        return {
          id: signature,
          type: 'Transaction',
          status: 'unknown',
          date: transaction && transaction.blockTime 
            ? new Date(transaction.blockTime * 1000).toLocaleString() 
            : new Date().toLocaleString(),
          amount: '',
          description: 'Transaction details unavailable',
          explorerUrl: `https://solscan.io/tx/${signature}`
        };
      }
  
      // Check transaction success status
      const isSuccessful = transaction.meta.err === null;
      const date = transaction.blockTime 
        ? new Date(transaction.blockTime * 1000).toLocaleString() 
        : 'Unknown';
      
      // Extract pre and post token balances
      const { postTokenBalances, preTokenBalances } = transaction.meta;
      
      // Get log messages for better transaction type detection
      const logMessages = transaction.meta.logMessages || [];
      const logString = logMessages.join(' ');
      
      // Initialize transaction details
      let type = 'Transaction';
      let amount = '';
      let description = '';
      
      // Check for specific transaction types based on logs
      const isSwap = logString.includes('Program JUP') || 
                    logString.includes('Jupiter') || 
                    logString.includes('swap') || 
                    logString.includes('Swap');
      
      if (isSwap) {
        type = 'Swap';
        
        // Track token balance changes by owner
        const walletAddress = publicKey.toString();
        const tokenChanges = [];
        
        // Map to store token info by mint address
        const tokenInfoMap = new Map();
        
        // Special handling for SOL balance changes - safely access properties
        let solBalanceChange = 0;
        if (transaction.meta.preBalances && transaction.meta.postBalances) {
          // Find the index of the wallet in the accounts array - safely access properties
          let walletIndex = -1;
          
          // Check different possible structures of the transaction
          if (transaction.transaction && transaction.transaction.message && transaction.transaction.message.accountKeys) {
            // For newer transaction format
            const accountKeys = transaction.transaction.message.accountKeys;
            walletIndex = accountKeys.findIndex(key => key.toString() === walletAddress);
          } else if (transaction.transaction && transaction.transaction.message && transaction.transaction.message.staticAccountKeys) {
            // For some versioned transactions
            const accountKeys = transaction.transaction.message.staticAccountKeys;
            walletIndex = accountKeys.findIndex(key => key.toString() === walletAddress);
          } else if (transaction.meta && transaction.meta.loadedAddresses) {
            // Try to find in loadedAddresses
            const writable = transaction.meta.loadedAddresses.writable || [];
            const readonly = transaction.meta.loadedAddresses.readonly || [];
            const allAddresses = [...writable, ...readonly];
            walletIndex = allAddresses.findIndex(key => key.toString() === walletAddress);
          }
          
          // If we found the wallet index
          if (walletIndex !== -1) {
            const preBalance = transaction.meta.preBalances[walletIndex] || 0;
            const postBalance = transaction.meta.postBalances[walletIndex] || 0;
            solBalanceChange = (postBalance - preBalance) / 1000000000; // Convert lamports to SOL
            
            // Only add if there's a significant change
            if (Math.abs(solBalanceChange) > 0.000001) {
              // Add SOL as a special token change
              tokenChanges.push({
                mint: 'So11111111111111111111111111111111111111112', // SOL mint address
                change: solBalanceChange,
                direction: solBalanceChange > 0 ? 'in' : 'out',
                preAmount: preBalance / 1000000000,
                postAmount: postBalance / 1000000000,
                isSOL: true
              });
              
              // Add SOL info to the token info map
              tokenInfoMap.set('So11111111111111111111111111111111111111112', {
                symbol: 'SOL',
                name: 'Solana',
                logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
                decimals: 9
              });
            }
          } else {
            console.log('Could not find wallet index in transaction accounts');
          }
        }
        
        // Process pre-balances to establish baseline for other tokens
        const preBalanceMap = new Map();
        for (const balance of preTokenBalances || []) {
          if (balance && balance.owner === walletAddress) {
            preBalanceMap.set(balance.mint, balance.uiTokenAmount.uiAmount || 0);
          }
        }
        
        // Process post-balances to find changes for other tokens
        for (const balance of postTokenBalances || []) {
          if (balance && balance.owner === walletAddress) {
            const preAmount = preBalanceMap.get(balance.mint) || 0;
            const postAmount = balance.uiTokenAmount.uiAmount || 0;
            const change = postAmount - preAmount;
            
            // Only consider significant changes
            if (Math.abs(change) > 0.000001) {
              tokenChanges.push({
                mint: balance.mint,
                change: change,
                direction: change > 0 ? 'in' : 'out',
                preAmount: preAmount,
                postAmount: postAmount
              });
            }
          }
        }
        
        // Also check for tokens that were completely spent
        for (const [mint, preAmount] of preBalanceMap.entries()) {
          if (!(postTokenBalances || []).some(b => b.mint === mint && b.owner === walletAddress)) {
            tokenChanges.push({
              mint: mint,
              change: -preAmount,
              direction: 'out',
              preAmount: preAmount,
              postAmount: 0
            });
          }
        }
        
        // Fetch token info for all changed tokens
        await Promise.all(tokenChanges
          .filter(change => !change.isSOL) // Skip SOL as we already added it
          .map(async (change) => {
            try {
              const info = await fetchTokenInfo(change.mint);
              tokenInfoMap.set(change.mint, info);
            } catch (err) {
              console.error(`Error fetching token info for ${change.mint}:`, err);
              // Set default info
              tokenInfoMap.set(change.mint, {
                symbol: change.mint.slice(0, 4) + '...',
                name: 'Unknown Token',
                logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
                decimals: 9
              });
            }
          })
        );
        
        // Find input (negative change) and output (positive change) tokens
        const inputTokens = tokenChanges.filter(t => t.direction === 'out')
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        
        const outputTokens = tokenChanges.filter(t => t.direction === 'in')
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        
        if (inputTokens.length > 0 && outputTokens.length > 0) {
          const inputToken = inputTokens[0];
          const outputToken = outputTokens[0];
          
          const inputInfo = tokenInfoMap.get(inputToken.mint);
          const outputInfo = tokenInfoMap.get(outputToken.mint);
          
          const inputSymbol = inputInfo?.symbol || inputToken.mint.slice(0, 4) + '...';
          const outputSymbol = outputInfo?.symbol || outputToken.mint.slice(0, 4) + '...';
          
          // Format the exact amounts with appropriate precision
          const formatAmount = (amount) => {
            if (Math.abs(amount) < 0.001) {
              return Math.abs(amount).toFixed(6);
            } else if (Math.abs(amount) < 1) {
              return Math.abs(amount).toFixed(4);
            } else if (Math.abs(amount) < 1000) {
              return Math.abs(amount).toFixed(2);
            } else {
              return Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
            }
          };
          
          const inputAmount = formatAmount(Math.abs(inputToken.change));
          const outputAmount = formatAmount(Math.abs(outputToken.change));
          
          // More detailed amount display
          amount = `${inputAmount} ${inputSymbol} → ${outputAmount} ${outputSymbol}`;
          
          // More detailed description
          description = `Swapped ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`;
        } else {
          description = 'Token Swap';
        }
    } else if (logString.includes('system_instruction') && logString.includes('transfer')) {
      type = 'Transfer';
      
      // Extract SOL amount from logs
      const transferMatch = logString.match(/Transfer: (\d+) lamports/);
      if (transferMatch && transferMatch[1]) {
        const lamports = parseInt(transferMatch[1]);
        const solAmount = lamports / 1000000000; // Convert lamports to SOL
        amount = `${solAmount.toFixed(4)} SOL`;
        
        // Determine if it's incoming or outgoing
        if (logString.includes(`to [${publicKey.toString()}`)) {
          description = `Received ${amount}`;
        } else {
          description = `Sent ${amount}`;
        }
      } else {
        description = 'SOL Transfer';
      }
    } else if (logString.includes('spl-token') && (logString.includes('transfer') || logString.includes('Transfer'))) {
      type = 'Token Transfer';
      
      // Try to extract token details from token balances
      if (postTokenBalances && preTokenBalances) {
        const walletAddress = publicKey.toString();
        const tokenChanges = [];
        
        // Process pre-balances to establish baseline
        const preBalanceMap = new Map();
        for (const balance of preTokenBalances) {
          if (balance && balance.owner === walletAddress) {
            preBalanceMap.set(balance.mint, balance.uiTokenAmount.uiAmount || 0);
          }
        }
        
        // Process post-balances to find changes
        for (const balance of postTokenBalances) {
          if (balance && balance.owner === walletAddress) {
            const preAmount = preBalanceMap.get(balance.mint) || 0;
            const postAmount = balance.uiTokenAmount.uiAmount || 0;
            const change = postAmount - preAmount;
            
            // Only consider significant changes
            if (Math.abs(change) > 0.000001) {
              tokenChanges.push({
                mint: balance.mint,
                change: change,
                direction: change > 0 ? 'in' : 'out'
              });
            }
          }
        }
        
        // Also check for tokens that were completely spent
        for (const [mint, preAmount] of preBalanceMap.entries()) {
          if (!postTokenBalances.some(b => b.mint === mint && b.owner === walletAddress)) {
            tokenChanges.push({
              mint: mint,
              change: -preAmount,
              direction: 'out'
            });
          }
        }
        
        if (tokenChanges.length > 0) {
          // Sort by absolute change value to get the most significant token
          tokenChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
          const mainChange = tokenChanges[0];
          
          // Fetch token info
          const tokenInfo = await fetchTokenInfo(mainChange.mint);
          const symbol = tokenInfo.symbol || mainChange.mint.slice(0, 4) + '...';
          
          // Format the amount with appropriate precision
          const formatAmount = (amount) => {
            if (Math.abs(amount) < 0.001) {
              return Math.abs(amount).toFixed(6);
            } else if (Math.abs(amount) < 1) {
              return Math.abs(amount).toFixed(4);
            } else if (Math.abs(amount) < 1000) {
              return Math.abs(amount).toFixed(2);
            } else {
              return Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
            }
          };
          
          const formattedAmount = formatAmount(mainChange.change);
          
          if (mainChange.direction === 'in') {
            type = 'Token Receive';
            amount = `${formattedAmount} ${symbol}`;
            description = `Received ${formattedAmount} ${symbol}`;
          } else {
            type = 'Token Send';
            amount = `${formattedAmount} ${symbol}`;
            description = `Sent ${formattedAmount} ${symbol}`;
          }
        } else {
          description = 'Token Transfer';
        }
      } else {
        description = 'Token Transfer';
      }
    } else if (logString.includes('Metaplex') || logString.includes('metadata')) {
      type = 'NFT Transaction';
      description = logString.includes('transfer') ? 'NFT Transfer' : 'NFT Interaction';
    } else if (logString.includes('Approval') || logString.includes('approval') || logString.includes('allowance')) {
      type = 'Approval';
      description = 'Token Approval';
    } else if (logString.includes('stake') || logString.includes('Stake')) {
      type = 'Staking';
      description = logString.includes('withdraw') ? 'Unstake' : 'Stake';
    } else if (logString.includes('pool') || logString.includes('liquidity')) {
      type = 'Liquidity';
      description = logString.includes('add') ? 'Add Liquidity' : 'Remove Liquidity';
    } else {
      // Generic transaction
      description = 'Transaction';
    }
    
    return {
      id: signature,
      type,
      status: isSuccessful ? 'success' : 'failed',
      date,
      amount,
      description,
      explorerUrl: `https://solscan.io/tx/${signature}`
    };
  } catch (err) {
    console.error("Error parsing transaction:", err);
    // Return a fallback object if parsing fails
    return {
      id: signature,
      type: 'Transaction',
      status: 'unknown',
      date: new Date().toLocaleString(),
      amount: '',
      description: 'Transaction details unavailable',
      explorerUrl: `https://solscan.io/tx/${signature}`
    };
  }
};


  // Function to fetch transaction history
  const fetchTransactionHistory = useCallback(async (before = null, forceRefresh = false) => {
    if (!connected || !publicKey) return;
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = `${publicKey.toString()}-${before || 'initial'}`;
    if (!forceRefresh && txCache.has(cacheKey) && !before) {
      setTransactions(txCache.get(cacheKey));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use your private endpoint
      const connection = new Connection('https://serene-morning-borough.solana-mainnet.quiknode.pro/5c7fead7ee024dca92ffcd6ee4ba831b7fbeda96/', 'confirmed');
      
      // Options for signature fetching
      const options = { limit: 10 };
      if (before) {
        options.before = before;
      }
      
      // Fetch signatures
      const signatures = await connection.getSignaturesForAddress(publicKey, options);
      
      if (signatures.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // Set flag if there might be more transactions
      setHasMore(signatures.length === options.limit);
      
      // Fetch transaction details for each signature
      const txPromises = signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          // Use our new parseTransactionDetails function
          return await parseTransactionDetails(tx, sig.signature);
        } catch (err) {
          console.error("Error fetching transaction details:", err);
          return {
            id: sig.signature,
            type: 'Unknown',
            status: 'failed',
            date: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown',
            amount: 'Error loading details',
            description: 'Transaction details unavailable',
            explorerUrl: `https://solscan.io/tx/${sig.signature}`
          };
        }
      });
      
      const txHistory = await Promise.all(txPromises);
      
      // Update state based on whether this is initial load or "load more"
      if (before) {
        setTransactions(prev => [...prev, ...txHistory]);
        // Update cache with combined results
        txCache.set(cacheKey, [...transactions, ...txHistory]);
      } else {
        setTransactions(txHistory);
        // Cache the results
        txCache.set(cacheKey, txHistory);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transaction history. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connected, publicKey]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    // Force refresh by passing true as the second parameter
    fetchTransactionHistory(null, true);
  };

  // Load more transactions
  const handleLoadMore = () => {
    if (transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      fetchTransactionHistory(lastTx.id);
    }
  };

  // Fetch transactions when wallet connects or menu opens
  useEffect(() => {
    if (connected && open) {
      fetchTransactionHistory();
    }
  }, [connected, open, fetchTransactionHistory]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const addressStr = address.toString();
    return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
  };

  const openExplorer = (url) => {
    window.open(url, '_blank');
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'swap':
        return <SwapHorizIcon fontSize="small" />;
      case 'transfer':
      case 'sol transfer':
        return <ArrowForwardIcon fontSize="small" />;
      case 'token receive':
        return <ArrowDownwardIcon fontSize="small" />;
      case 'token send':
        return <ArrowUpwardIcon fontSize="small" />;
      case 'nft transaction':
        return <ImageIcon fontSize="small" />;
      case 'staking':
        return <AccountBalanceIcon fontSize="small" />;
      case 'liquidity':
        return <WaterIcon fontSize="small" />;
      case 'approval':
        return <ReceiptIcon fontSize="small" />;
      default:
        return <SwapHorizIcon fontSize="small" />;
    }
  };

  if (!connected) {
    return <WalletMultiButton {...props} />;
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        startIcon={<AccountBalanceWalletIcon />}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          ...props.sx
        }}
        {...props}
      >
        {formatAddress(publicKey)}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 500,
            overflow: 'auto',
            borderRadius: 2,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Wallet
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: 'primary.main',
                mr: 1
              }}
            >
              <AccountBalanceWalletIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap>
                {formatAddress(publicKey)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solana
              </Typography>
            </Box>
            <Tooltip title={copied ? "Copied!" : "Copy address"}>
              <Button 
                size="small" 
                onClick={copyAddress}
                startIcon={<ContentCopyIcon fontSize="small" />}
                sx={{ minWidth: 'auto' }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Recent Transactions
            </Typography>
            <Tooltip title="Refresh transactions">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                {refreshing ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          
          {error && (
            <Typography variant="body2" color="error" sx={{ py: 1 }}>
              {error}
            </Typography>
          )}
          
          {transactions.length > 0 ? (
            <Box>
              {transactions.map((tx) => (
                <Box 
                  key={tx.id}
                  sx={{ 
                    py: 1.5, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getTransactionIcon(tx.type)}
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                          {tx.type}
                        </Typography>
                        <Tooltip title="View in Explorer">
                          <IconButton 
                            size="small" 
                            onClick={() => openExplorer(tx.explorerUrl)}
                            sx={{ padding: 0.25 }}
                          >
                            <LaunchIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2">
                        {tx.description || tx.amount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tx.date}
                      </Typography>
                    </Box>
                    {tx.status === 'success' ? (
                      <CheckCircleOutlineIcon fontSize="small" color="success" />
                    ) : tx.status === 'failed' ? (
                      <CancelOutlinedIcon fontSize="small" color="error" />
                    ) : (
                      <CircularProgress size={16} />
                    )}
                  </Box>
                </Box>
              ))}
              
              {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Button 
                    size="small" 
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                    Load More
                  </Button>
                </Box>
              )}
            </Box>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No recent transactions
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => { disconnect(); handleClose(); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Disconnect</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default WalletConnectButton;


