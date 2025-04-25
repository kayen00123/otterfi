import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  IconButton, 
  FormControl, 
  Select, 
  MenuItem, 
  InputAdornment,
  Snackbar,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Tooltip,
  useTheme,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { VersionedTransaction } from '@solana/web3.js';
import { Link } from 'react-router-dom';
import WalletConnectButton from '../components/WalletConnectButton';
import Header from '../components/Header';
import { useTokenList } from '../utils/tokenList';
import { getTokenBalance, validateSolanaAddress, fetchTokenInfo } from '../utils/tokenUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import TradingViewChart from '../components/TradingViewChart';
import TrendingSolanaTokens from '../components/TrendingSolanaTokens';
import { recordTransaction } from '../services/analyticsService';
import CloseIcon from '@mui/icons-material/Close';
import SwapDetails from '../components/SwapDetails';
import bs58 from 'bs58';
import nacl from 'tweetnacl';


const formatUsdValue = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};


const FEE_BPS = 40; // 0.4% = 40 basis points

const FEE_ACCOUNTS = {
  // SOL fee account
 "So11111111111111111111111111111111111111112": "8Bs1aHeo2aje8MqXBEK6JPwVp6qMo5STGQbiYfGQ4Vf8",
   
  // USDT fee account
 "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "C7MPZc9VbMo5EhBaXTLZtQrwCLmVg3McHGbVPuAEvbsK",
   
  // JUP fee account
 "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "D7R576QacfN4hSnZbqikyp6rDum6LmhWBcz6UqskmA5f",
   
 // POX fee account
 "mpoxP5wyoR3eRW8L9bZjGPFtCsmX8WcqU5BHxFW1xkn": "GXJPxdp4ncFkSRxCytRutsHiC8pTcnvxxTgSPBzbgAwD",
 
 // TRUMP fee account
 "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN": "CEg3V9jV3RJsUbtvE22RRCtjfGpajd86WuipT1AuwYL6",
   
 // FART fee account
 "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump": "6z6acWg1dwP3yuuGukYntKwGnz2qKAtjyQheRfUpMADt",
 
 // cbBTC fee account
 "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij": "Dg7RehydfJFVxpkX4JkwpPY99Tecoy1EW8MCnUzbHf3g",
 
 // USDe fee account
 "DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT": "DAxZkUQwjCvptuZqpidCUQWXUfC4VmwEUMjReJwz3KDb",
 
 // GRASS fee account
 "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs": "Any33YEWfCUJF6PZiTDRYaVTu4uGVRS75jTSP3deqkPF",
   
 // Bonk fee account
 "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "Bi5hqaKCbaoZvh2BSTawyxC2g5bCadqFgaVXQ2cxATJM",
 
 // WIF fee account
 "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "8cBMbQc3Sxe8SoUwyFWe9Kp596sX78jSUeJpZ3u8FtcD",
 
 // JitoSOL fee account
 "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": "878UfhL2rQqQsKeYsMdWkqH5xYJ1pASjbKjFr5H89Uxd",
 
 // RAY fee account
 "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "DYr38CN5mrWk4MgnufogniyRK9xKVWnVzrKRMGYbzx4h",
 
   // Default fee account for all other tokens
   "DEFAULT": "J3mmyrV6bFSbejBHC3kBzhdY17Y7gJSx1bR53Lx8oQ2V"
 };


// Constants for localStorage keys
const ANALYTICS_KEYS = {
  TRANSACTIONS: 'solanatrade_transactions',
  DAILY_VOLUMES: 'solanatrade_daily_volumes',
  PAIRS_VOLUME: 'solanatrade_pairs_volume'
};

// Record transaction directly
const recordSwapForAnalytics = (transaction) => {
  try {
    console.log('DIRECT ANALYTICS: Recording transaction:', transaction);
    
    // Add timestamp
    const txWithTimestamp = {
      ...transaction,
      timestamp: Date.now()
    };
    
    // Get existing transactions
    const existingTxsStr = localStorage.getItem(ANALYTICS_KEYS.TRANSACTIONS);
    const existingTxs = existingTxsStr ? JSON.parse(existingTxsStr) : [];
    
    // Add new transaction
    existingTxs.push(txWithTimestamp);
    
    // Save back to storage
    localStorage.setItem(ANALYTICS_KEYS.TRANSACTIONS, JSON.stringify(existingTxs));
    
    // Update daily volumes
    updateDailyVolume(transaction.usdValue || 0);
    
    // Update pairs volume
    updatePairsVolume(
      transaction.fromToken, 
      transaction.toToken, 
      transaction.usdValue || 0
    );
    
    console.log('DIRECT ANALYTICS: Transaction recorded successfully');
  } catch (error) {
    console.error('Error recording transaction for analytics:', error);
  }
};

// Update daily volume
const updateDailyVolume = (usdValue) => {
  try {
    // Get existing daily volumes
    const volumesStr = localStorage.getItem(ANALYTICS_KEYS.DAILY_VOLUMES);
    const dailyVolumes = volumesStr ? JSON.parse(volumesStr) : [];
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's record or create new one
    const todayRecord = dailyVolumes.find(item => item.date === today);
    
    if (todayRecord) {
      todayRecord.volume += usdValue;
    } else {
      dailyVolumes.push({
        date: today,
        volume: usdValue
      });
    }
    
    // Save back to storage
    localStorage.setItem(ANALYTICS_KEYS.DAILY_VOLUMES, JSON.stringify(dailyVolumes));
  } catch (error) {
    console.error('Error updating daily volume:', error);
  }
};

// Update pairs volume
const updatePairsVolume = (fromToken, toToken, usdValue) => {
  try {
    // Get existing pairs volume
    const volumesStr = localStorage.getItem(ANALYTICS_KEYS.PAIRS_VOLUME);
    const pairsVolume = volumesStr ? JSON.parse(volumesStr) : [];
    
    // Create pair key (alphabetically sorted to ensure consistency)
    const tokens = [fromToken, toToken].sort();
    const pairKey = `${tokens[0]}-${tokens[1]}`;
    
    // Find pair record or create new one
    const pairRecord = pairsVolume.find(item => item.pair === pairKey);
    
    if (pairRecord) {
      pairRecord.volume += usdValue;
      pairRecord.count += 1;
    } else {
      pairsVolume.push({
        pair: pairKey,
        tokens: tokens,
        volume: usdValue,
        count: 1
      });
    }
    
    // Save back to storage
    localStorage.setItem(ANALYTICS_KEYS.PAIRS_VOLUME, JSON.stringify(pairsVolume));
  } catch (error) {
    console.error('Error updating pairs volume:', error);
  }
};

// Function to fetch token from CoinCodex
const fetchTokenFromCoinCodex = async (symbol) => {
  try {
    // Normalize the symbol to uppercase
    const normalizedSymbol = symbol.toUpperCase();
    
    // Fetch token data from CoinCodex API
    const response = await fetch(`https://coincodex.com/api/coincodex/get_coin/${normalizedSymbol}`);
    
    if (!response.ok) {
      console.warn(`CoinCodex API returned ${response.status} for symbol ${normalizedSymbol}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we got valid data
    if (!data || !data.symbol) {
      console.warn(`No valid data returned from CoinCodex for symbol ${normalizedSymbol}`);
      return null;
    }
    
    // Check if the token has a Solana address
    if (!data.addresses || !data.addresses.solana) {
      console.warn(`Token ${normalizedSymbol} doesn't have a Solana address in CoinCodex data`);
      return null;
    }
    
    // Format the token data to match your application's format
    return {
      address: data.addresses.solana,
      symbol: data.symbol,
      name: data.name,
      decimals: 9, // Default to 9 decimals for Solana tokens
      image: data.icon_url || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
      volume24h: data.volume_24h || 0,
      liquidity: 0, // CoinCodex might not provide this
      price: data.last_price_usd || 0,
      priceChange24h: data.change_24h || 0,
      fromCoinCodex: true // Flag to indicate this token came from CoinCodex
    };
  } catch (error) {
    console.error('Error fetching token from CoinCodex:', error);
    return null;
  }
};

const SwapPage = () => {
  const theme = useTheme();
  const { connected, publicKey, sendTransaction } = useWallet();
  
  // State
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [fromTokenBalance, setFromTokenBalance] = useState(0);
  const [toTokenBalance, setToTokenBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [importTokenAddress, setImportTokenAddress] = useState('');
  const [importTokenInfo, setImportTokenInfo] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [priceImpact, setPriceImpact] = useState(null);
  const [customTokens, setCustomTokens] = useLocalStorage('customTokens', []);
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [tokenToImport, setTokenToImport] = useState(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [fromUsdValue, setFromUsdValue] = useState(null);
  const [toUsdValue, setToUsdValue] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showRoutesDialog, setShowRoutesDialog] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [routeMarkets, setRouteMarkets] = useState([]);
  const [txStatus, setTxStatus] = useState('');
  const [txMessage, setTxMessage] = useState('');
  const [networkFee, setNetworkFee] = useState(0.000005);
  const [route, setRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const fromTokenAddressRef = useRef(null);
  const toTokenAddressRef = useRef(null);
  const priceRefreshIntervalRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState(null);
  const [txDeadline, setTxDeadline] = useState('30');
  const { tokens: jupiterTokens, popularTokens, loading: tokensLoading } = useTokenList();

  // Create a Solana connection
  const connection = new Connection(
    'https://mainnet.helius-rpc.com/?api-key=887a40ac-2f47-4df7-bc37-1b9589ba5a48',
    'confirmed'
  );
  
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

  // Add this function to fetch token metadata accurately
  const fetchAccurateTokenInfo = async (tokenAddress) => {
    try {
      // First check if it's a valid Solana address
      if (!validateSolanaAddress(tokenAddress)) {
        return null;
      }
      
      console.log(`Fetching accurate token info for ${tokenAddress}`);
      
      // Get token metadata from on-chain
      const tokenMint = new PublicKey(tokenAddress);
      const mintInfo = await connection.getParsedAccountInfo(tokenMint);
      
      if (!mintInfo || !mintInfo.value || !mintInfo.value.data) {
        console.warn(`No mint info found for ${tokenAddress}`);
        return null;
      }
      
      // Parse the data to get decimals
      const parsedData = mintInfo.value.data;
      let decimals = 9; // Default
      
      if ('parsed' in parsedData && 
          parsedData.parsed.type === 'mint' && 
          'info' in parsedData.parsed && 
          'decimals' in parsedData.parsed.info) {
        decimals = parsedData.parsed.info.decimals;
        console.log(`Found on-chain decimals for ${tokenAddress}: ${decimals}`);
      }
      
      // Try to get token info from Jupiter API
      const response = await fetch(`https://token.jup.ag/all`);
      const allTokens = await response.json();
      
      // Find the token in Jupiter's list
      const jupiterToken = allTokens.find(t => t.address === tokenAddress);
      
      if (jupiterToken) {
        console.log(`Found token in Jupiter list: ${jupiterToken.symbol}`);
        return {
          ...jupiterToken,
          decimals: decimals // Use the on-chain decimals for accuracy
        };
      }
      
      // If not found in Jupiter, create a basic token info
      return {
        address: tokenAddress,
        symbol: `Token-${tokenAddress.slice(0, 4)}`,
        name: `Unknown Token ${tokenAddress.slice(0, 8)}`,
        decimals: decimals,
        image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        extensions: {},
        hasFreeze: false // Assume no freeze authority
      };
    } catch (error) {
      console.error('Error fetching accurate token info:', error);
      return null;
    }
  };


  const phantomSignAndSendTransaction = async (transaction) => {
    try {
      // Check if Phantom is installed and connected
      if (!window.phantom || !window.phantom.solana || !window.phantom.solana.isConnected) {
        console.log('Phantom wallet not detected or not connected, falling back to adapter');
        throw new Error('Phantom wallet not connected');
      }
      
      // Get the Phantom provider
      const provider = window.phantom.solana;
      console.log('Using Phantom native signAndSendTransaction method');
      
      // Use Phantom's signAndSendTransaction method directly
      const { signature } = await provider.signAndSendTransaction(transaction);
      console.log('Phantom signAndSendTransaction successful with signature:', signature);
      
      return signature;
    } catch (error) {
      console.error('Error using Phantom signAndSendTransaction:', error);
      throw error;
    }
  };
  
  

  // Improved token balance fetching function
  const fetchTokenBalances = async () => {
    if (!connected || !publicKey || !fromToken || !toToken) return;
    
    try {
      console.log(`Fetching balance for ${fromToken.symbol} (${fromToken.address})`);
      
      // For SOL token
      if (fromToken.address === "So11111111111111111111111111111111111111112") {
        const solBalance = await connection.getBalance(publicKey);
        // Leave some SOL for transaction fees
        const adjustedBalance = (solBalance / LAMPORTS_PER_SOL) - 0.01;
        setFromTokenBalance(Math.max(0, adjustedBalance));
      } else {
        const fromBalance = await getTokenBalance(
          connection, 
          fromToken.address, 
          publicKey.toString()
        );
        setFromTokenBalance(fromBalance);
      }
      
      // For TO token
      if (toToken.address === "So11111111111111111111111111111111111111112") {
        const solBalance = await connection.getBalance(publicKey);
        setToTokenBalance(solBalance / LAMPORTS_PER_SOL);
      } else {
        const toBalance = await getTokenBalance(
          connection, 
          toToken.address, 
          publicKey.toString()
        );
        setToTokenBalance(toBalance);
      }
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  // Updated fetchPrice function with better error handling and decimal precision
  const fetchPrice = useCallback(async (amount) => {
    if (!amount || !fromToken || !toToken) return;
    
    setLoading(true);
    try {
      // Ensure proper decimal handling for the input amount
      const inputAmount = Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals));
      
      console.log(`Fetching quote for ${inputAmount} (${amount} ${fromToken.symbol}) to ${toToken.symbol}`);
      
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.address}`+
        `&outputMint=${toToken.address}`+
        `&amount=${inputAmount}`+
        `&slippageBps=${Math.floor(slippage * 100)}`
      );
      
      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        console.error("Jupiter quote error:", errorData);
        throw new Error(`Jupiter API error: ${errorData.error || 'Failed to get quote'}`);
      }
      
      const quoteData = await quoteResponse.json();
      console.log("Jupiter quote data:", quoteData);
      
      // Get token prices
      const [fromResponse, toResponse] = await Promise.all([
        fetch(`https://api.jup.ag/price/v2?ids=${fromToken.address}`),
        fetch(`https://api.jup.ag/price/v2?ids=${toToken.address}`)
      ]);
      
      const fromData = await fromResponse.json();
      const toData = await toResponse.json();
      
      console.log("From token price data:", fromData);
      console.log("To token price data:", toData);
      
      if (fromData.data && toData.data) {
        const fromPrice = parseFloat(fromData.data[fromToken.address]?.price || 0);
        const toPrice = parseFloat(toData.data[toToken.address]?.price || 0);
        
        console.log(`Token prices: ${fromToken.symbol}=${fromPrice}, ${toToken.symbol}=${toPrice}`);
        
        // Calculate output amount from Jupiter quote for better accuracy
        const outputAmount = quoteData.outAmount / Math.pow(10, toToken.decimals);
        setToAmount(outputAmount.toFixed(6));
        
        // Calculate exchange rate
        const exchangeRate = fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : null;
        setExchangeRate(exchangeRate);
        
        // Set USD values
        setFromUsdValue(parseFloat(amount) * fromPrice);
        setToUsdValue(outputAmount * toPrice);
        
        // Set route information
        setRoute(quoteData.routePlan?.map(step => step.swapInfo?.label) || [fromToken.symbol, toToken.symbol]);
        
        // Set the real price impact from Jupiter quote
        if (quoteData && quoteData.priceImpactPct) {
          setPriceImpact(parseFloat(quoteData.priceImpactPct) * 100);
        }
        
        setLastPriceUpdate(new Date());
        
        // Store available routes for later use
        if (quoteData.routesInfos) {
          setAvailableRoutes(quoteData.routesInfos);
          
          // Extract market information
          const markets = quoteData.routePlan?.map(step => step.swapInfo?.label) || ['Jupiter'];
          setRouteMarkets(markets);
        }
      } else {
        // Handle case where price data is not available
        // Use Jupiter quote data directly
        const outputAmount = quoteData.outAmount / Math.pow(10, toToken.decimals);
        setToAmount(outputAmount.toFixed(6));
        
        // Set route information
        setRoute(quoteData.routePlan?.map(step => step.swapInfo?.label) || [fromToken.symbol, toToken.symbol]);
        
        // Set the price impact from Jupiter quote
        if (quoteData && quoteData.priceImpactPct) {
          setPriceImpact(parseFloat(quoteData.priceImpactPct) * 100);
        }
        
        setLastPriceUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setError(`Failed to fetch price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, slippage]);

// Update this function in SwapPage.js
const handleTokenSelect = async (token, isFromToken) => {
  setLoading(true);
  try {
    // For custom tokens, make sure we use the metadata we already have
    if (isCustomToken(token.address)) {
      // Find the token in our custom tokens list to get the correct metadata
      const customToken = customTokens.find(t => t.address === token.address);
      if (customToken) {
        // Use the custom token's metadata
        token = {
          ...customToken,
          // Ensure these fields exist for UI consistency
          image: customToken.image || customToken.logo || customToken.logoURI,
          logo: customToken.logo || customToken.image || customToken.logoURI,
          logoURI: customToken.logoURI || customToken.logo || customToken.image
        };
        console.log('Using custom token metadata:', token);
      }
    }
    
    if (isFromToken) {
      setFromToken(token);
      fromTokenAddressRef.current = token.address;
      setIsFromDropdownOpen(false);
    } else {
      setToToken(token);
      toTokenAddressRef.current = token.address;
      setIsToDropdownOpen(false);
    }
    setSearchQuery('');
    
    // Reset amounts and price data when tokens change
    setFromAmount('');
    setToAmount('');
    setFromUsdValue(null);
    setToUsdValue(null);
    setExchangeRate(null);
    setPriceImpact(null);
    setRouteMarkets([]);
    
    // Fetch updated balances
    if (connected && publicKey) {
      fetchTokenBalances();
    }
  } catch (error) {
    console.error("Error selecting token:", error);
    setError("Failed to select token: " + error.message);
  } finally {
    setLoading(false);
  }
};

// Update the handleImportToken function with this simpler approach
const handleImportToken = async (isFromToken) => {
  if (importTokenAddress) {
    setLoading(true);
    try {
      // Get token decimals directly from the blockchain
      const tokenMint = new PublicKey(importTokenAddress);
      const mintInfo = await connection.getParsedAccountInfo(tokenMint);
      
      let decimals = 9; // Default
      if (mintInfo?.value?.data && 'parsed' in mintInfo.value.data) {
        decimals = mintInfo.value.data.parsed.info.decimals;
        console.log(`Found on-chain decimals: ${decimals}`);
      }
      
      // Create token with accurate decimals
      const finalToken = {
        address: importTokenAddress,
        symbol: importTokenInfo?.symbol || `Token-${importTokenAddress.slice(0, 4)}`,
        name: importTokenInfo?.name || `Unknown Token ${importTokenAddress.slice(0, 8)}`,
        decimals: decimals,
        image: importTokenInfo?.image || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        logo: importTokenInfo?.image || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        logoURI: importTokenInfo?.image || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
      };
      
      // Add to custom tokens
      if (!customTokens.some(t => t.address === finalToken.address)) {
        setCustomTokens([...customTokens, finalToken]);
      }
      
      // Select the token
      if (isFromToken) {
        setFromToken(finalToken);
        fromTokenAddressRef.current = finalToken.address;
        setIsFromDropdownOpen(false);
      } else {
        setToToken(finalToken);
        toTokenAddressRef.current = finalToken.address;
        setIsToDropdownOpen(false);
      }
      
      // Reset import state
      setImportTokenInfo(null);
      setImportTokenAddress('');
      setSearchQuery('');
      
      // Update swap parameters in Jupiter API request
      if (fromAmount && parseFloat(fromAmount) > 0) {
        // Wait a moment for Jupiter to recognize the token
        setTimeout(() => fetchPrice(fromAmount), 500);
      }
    } catch (error) {
      console.error("Error importing token:", error);
      setError("Failed to import token: " + error.message);
    } finally {
      setLoading(false);
    }
  }
};



  // Confirm token import with improved metadata handling
  const confirmImportToken = async (isFromToken) => {
    if (tokenToImport) {
      setLoading(true);
      try {
        // Ensure we have accurate token information
        const accurateToken = await fetchAccurateTokenInfo(tokenToImport.address);
        const finalToken = accurateToken || tokenToImport;
        
        // Add to custom tokens if not already there
        if (!customTokens.some(t => t.address === finalToken.address)) {
          // Store the token in localStorage
          setCustomTokens([...customTokens, finalToken]);
          console.log(`Token ${finalToken.symbol} added to custom tokens list with decimals: ${finalToken.decimals}`);
        } else {
          // Update existing token with accurate information
          const updatedCustomTokens = customTokens.map(t => 
            t.address === finalToken.address ? finalToken : t
          );
          setCustomTokens(updatedCustomTokens);
          console.log(`Updated token ${finalToken.symbol} in custom tokens list with decimals: ${finalToken.decimals}`);
        }
        
        // Select the token
        handleTokenSelect(finalToken, isFromToken);
        
        // Reset import state
        setTokenToImport(null);
        setShowImportWarning(false);
        setImportConfirmed(false);
        setImportTokenInfo(null);
        setImportTokenAddress('');
      } catch (error) {
        console.error("Error confirming token import:", error);
        setError("Failed to import token: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // When setting default tokens
  useEffect(() => {
    if (jupiterTokens.length > 0 && !fromToken && !toToken) {
      // Find SOL and USDC tokens
      const solToken = jupiterTokens.find(t => t.symbol === 'SOL');
      const usdcToken = jupiterTokens.find(t => t.symbol === 'USDC');
      
      // Ensure tokens have valid decimals
      if (solToken && typeof solToken.decimals === 'number') {
        console.log('Setting SOL token with decimals:', solToken.decimals);
        setFromToken(solToken);
        fromTokenAddressRef.current = solToken.address;
      }
      
      if (usdcToken && typeof usdcToken.decimals === 'number') {
        console.log('Setting USDC token with decimals:', usdcToken.decimals);
        setToToken(usdcToken);
        toTokenAddressRef.current = usdcToken.address;
      }
      
      setFilteredTokens(jupiterTokens);
    }
  }, [jupiterTokens]);
  
  // Update token balances when wallet connects or tokens change
  useEffect(() => {
    if (connected && publicKey && fromToken && toToken) {
      fetchTokenBalances();
    }
  }, [connected, publicKey, fromToken?.address, toToken?.address]);
  
  // Combine Jupiter tokens with custom tokens
  useEffect(() => {
    if (jupiterTokens.length > 0) {
      // Create a map of addresses to avoid duplicates
      const tokenMap = new Map();
      
      // Add Jupiter tokens to map
      jupiterTokens.forEach(token => {
        tokenMap.set(token.address, token);
      });
      
      // Add custom tokens to map (will overwrite Jupiter tokens if same address)
      customTokens.forEach(token => {
        tokenMap.set(token.address, token);
      });
      
      // Convert map back to array
      const allTokens = Array.from(tokenMap.values());
      setFilteredTokens(allTokens);
      
      console.log(`Combined token list has ${allTokens.length} tokens (${jupiterTokens.length} from Jupiter, ${customTokens.length} custom)`);
    }
  }, [jupiterTokens, customTokens]);
  
  // Filter tokens based on search query
  useEffect(() => {
    const searchTokens = async () => {
      if (searchQuery) {
        // First, search in existing Jupiter tokens
        const filtered = jupiterTokens.filter(token => 
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address.toLowerCase() === searchQuery.toLowerCase()
        );
        setFilteredTokens(filtered);
        
        // Check if the search query is a valid Solana address
        if (validateSolanaAddress(searchQuery) && !filtered.some(t => t.address === searchQuery)) {
          setImportTokenAddress(searchQuery);
          fetchTokenInfo(searchQuery).then(tokenInfo => {
            if (tokenInfo) {
              setImportTokenInfo(tokenInfo);
            } else {
              setImportTokenInfo(null);
            }
          });
        } else {
          setImportTokenAddress('');
          setImportTokenInfo(null);
          
          // If no tokens found in Jupiter list and it's not an address, try CoinCodex
          if (filtered.length === 0 && searchQuery.length >= 2) {
            // Try to fetch from CoinCodex
            const coinCodexToken = await fetchTokenFromCoinCodex(searchQuery);
            
            if (coinCodexToken) {
              // If token found on CoinCodex, set it as import token info
              setImportTokenInfo(coinCodexToken);
              setImportTokenAddress(coinCodexToken.address);
            }
          }
        }
      } else {
        // If search query is empty, reset to all tokens
        if (jupiterTokens.length > 0) {
          const tokenMap = new Map();
          jupiterTokens.forEach(token => tokenMap.set(token.address, token));
          customTokens.forEach(token => tokenMap.set(token.address, token));
          setFilteredTokens(Array.from(tokenMap.values()));
        }
        setImportTokenAddress('');
        setImportTokenInfo(null);
      }
    };
    
    searchTokens();
  }, [searchQuery, jupiterTokens, customTokens]);
  
  // Set up price refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (priceRefreshIntervalRef.current) {
      clearInterval(priceRefreshIntervalRef.current);
      priceRefreshIntervalRef.current = null;
    }
    
    // Only set up interval if we have all required data
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken) {
      // Initial fetch
      fetchPrice(fromAmount);
      
      // Set up interval for refreshing price every 30 seconds
      priceRefreshIntervalRef.current = setInterval(() => {
        fetchPrice(fromAmount);
      }, 7000);
    }
    
    return () => {
      if (priceRefreshIntervalRef.current) {
        clearInterval(priceRefreshIntervalRef.current);
        priceRefreshIntervalRef.current = null;
      }
    };
  }, [fromAmount, fromToken?.address, toToken?.address, fetchPrice]);

  // Function to check if a token is custom/imported
  const isCustomToken = (tokenAddress) => {
    return customTokens.some(t => t.address === tokenAddress);
  };

  // Function to get the appropriate fee account based on the token
  const getFeeAccount = (tokenAddress) => {
    // If we have a specific fee account for this token, use it
    if (FEE_ACCOUNTS[tokenAddress]) {
      return FEE_ACCOUNTS[tokenAddress];
    }
    
    // Otherwise use the default fee account
    return FEE_ACCOUNTS.DEFAULT;
  };
    
  // Swap tokens
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    fromTokenAddressRef.current = toToken?.address;
    setToToken(temp);
    toTokenAddressRef.current = temp?.address;
    
    setFromAmount('');
    setToAmount('');
    setFromUsdValue(null);
    setToUsdValue(null);
    setAvailableRoutes([]);
    setSelectedRouteIndex(0);
    setRouteMarkets([]);
  };
  
  // Handle refresh price
  const handleRefreshPrice = async () => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken) {
      setRefreshingPrice(true);
      await fetchPrice(fromAmount);
      setRefreshingPrice(false);
    }
  };

  const executeSwap = async () => {
    if (!connected || !publicKey || !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setLoading(true);
    setTxStatus('processing');
    setTxMessage('Preparing swap...');
    let signature;
  
    try {
      // Ensure proper decimal handling
      const inputAmountInSmallestUnit = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
      
      console.log(`Swapping ${fromAmount} ${fromToken.symbol} (${inputAmountInSmallestUnit} base units) to ${toToken.symbol}`);
      
      // First, check if the user has enough tokens with a small buffer for SOL
      if (fromToken.address === "So11111111111111111111111111111111111111112") {
        // For SOL, leave some for transaction fees
        if (fromTokenBalance < parseFloat(fromAmount) + 0.01) {
          throw new Error(`Insufficient SOL balance. Keep some SOL for transaction fees.`);
        }
      } else if (fromTokenBalance < parseFloat(fromAmount)) {
        throw new Error(`Insufficient ${fromToken.symbol} balance`);
      }
      
      // Get quote with platform fee
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.address}`+
        `&outputMint=${toToken.address}`+
        `&amount=${inputAmountInSmallestUnit}`+
        `&slippageBps=${Math.floor(slippage * 100)}`+
        `&platformFeeBps=${FEE_BPS}` // Add platform fee (0.8%)
      );
      
      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        throw new Error(`Failed to get quote: ${errorData.error || 'Unknown error'}`);
      }
      
      const quoteData = await quoteResponse.json();
      console.log("Swap quote data:", quoteData);
  
      setTxMessage('Building transaction...');
      
      // Fee account selection
      let feeAccount;
      const hasFeeAccountForInput = FEE_ACCOUNTS[fromToken.address] !== undefined;
      const hasFeeAccountForOutput = FEE_ACCOUNTS[toToken.address] !== undefined;
  
      if (hasFeeAccountForInput) {
        feeAccount = FEE_ACCOUNTS[fromToken.address];
        console.log(`Taking fees from input token ${fromToken.symbol}: ${feeAccount}`);
      } else if (hasFeeAccountForOutput) {
        feeAccount = FEE_ACCOUNTS[toToken.address];
        console.log(`Taking fees from output token ${toToken.symbol}: ${feeAccount}`);
      } else {
        feeAccount = FEE_ACCOUNTS.DEFAULT;
        console.log(`Using default fee account: ${feeAccount}`);
      }
      
      // Use Jupiter's recommended approach for referral fees
      const swapRequestBody = {
        quoteResponse: quoteData,
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
        // Use the correct referral parameters
        platformFeeBps: FEE_BPS, // 0.8%
        feeAccount: feeAccount, // Use the selected fee account
        computeUnitPriceMicroLamports: 10000,
        asLegacyTransaction: false, // Use versioned transactions for better compatibility
        // Add skipUserAccountsCheck for better handling of custom tokens
        skipUserAccountsCheck: true
      };
      
      console.log("Swap request with fee:", swapRequestBody);
      
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(swapRequestBody)
      });
  
      if (!swapResponse.ok) {
        const errorData = await swapResponse.json();
        throw new Error(`Failed to create swap transaction: ${errorData.error || 'Unknown error'}`);
      }
  
      const swapData = await swapResponse.json();
      const { swapTransaction } = swapData;
      
      if (!swapTransaction) {
        throw new Error('No swap transaction received');
      }
  
      setTxMessage('Please approve in wallet...');
      
      // Deserialize the transaction
      const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
      
      // Try to use Phantom's native method first, otherwise fall back to wallet adapter
try {
  if (window.phantom && window.phantom.solana) {
    console.log('Phantom wallet detected, attempting to use native signAndSendTransaction');
    signature = await phantomSignAndSendTransaction(transaction);
    console.log('Successfully used Phantom native signAndSendTransaction');
  } else {
    console.log('No Phantom wallet detected, using wallet adapter sendTransaction');
    // Use the wallet adapter's sendTransaction function
    signature = await sendTransaction(transaction, connection);
  }
} catch (error) {
  console.error('Transaction signing failed:', error);
  if (window.phantom && window.phantom.solana) {
    console.log('Failed with Phantom, falling back to wallet adapter');
    try {
      signature = await sendTransaction(transaction, connection);
    } catch (fallbackError) {
      console.error('Fallback to wallet adapter also failed:', fallbackError);
      throw fallbackError;
    }
  } else {
    throw error;
  }
}
      
      setTxMessage('Processing swap... This may take a moment.');
      
      // Wait for transaction confirmation with better error handling
      try {
        // First, log the transaction signature for debugging
        console.log("Transaction sent with signature:", signature);
        setTxMessage(`Transaction sent! Waiting for confirmation... (${signature.slice(0, 8)}...)`);
        
        // Use a more reliable confirmation approach
        const confirmationStrategy = {
          signature: signature,
          commitment: 'confirmed',
          timeout: 90000 // 90 seconds timeout
        };
        
        try {
          // Wait for confirmation with a longer timeout
          await connection.confirmTransaction(confirmationStrategy);
          
          // If we get here, the transaction was confirmed
          setSuccess(true);
          setTxStatus('success');
          setTxMessage(
            <div>
              Swap completed! View on{' '}
              <a 
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3498db', textDecoration: 'underline' }}
              >
                Solscan
              </a>
            </div>
          );
          
          // Record transaction for analytics
          try {
            recordSwapForAnalytics({
              fromToken: fromToken.symbol,
              toToken: toToken.symbol,
              fromAmount: parseFloat(fromAmount),
              toAmount: parseFloat(toAmount),
              usdValue: fromUsdValue || 0,
              txHash: signature,
              walletAddress: publicKey.toString()
            });
          } catch (analyticsError) {
            console.error('Error recording analytics:', analyticsError);
          }
          
          // Reset form
          setFromAmount('');
          setToAmount('');
          setFromUsdValue(null);
          setToUsdValue(null);
          setExchangeRate(null);
          setPriceImpact(null);
          
          // Update balances after swap
          fetchTokenBalances();
        } catch (confirmError) {
          // If confirmation times out or fails, check the status manually
          console.log("Confirmation timed out, checking status manually...");
          
          // Check transaction status one more time
          const status = await connection.getSignatureStatus(signature);
          console.log("Final transaction status check:", status);
          
          if (status && status.value !== null) {
            if (status.value.err) {
              // Transaction definitely failed
              console.error("Transaction error:", status.value.err);
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            } else if (status.value.confirmationStatus === 'confirmed' || 
                      status.value.confirmationStatus === 'finalized') {
              // Transaction succeeded despite timeout
              setSuccess(true);
              setTxStatus('success');
              setTxMessage(
                <div>
                  Swap completed! View on{' '}
                  <a 
                    href={`https://solscan.io/tx/${signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'underline' }}
                  >
                    Solscan
                  </a>
                </div>
              );
              
              // Record analytics and reset form as above
              try {
                recordSwapForAnalytics({
                  fromToken: fromToken.symbol,
                  toToken: toToken.symbol,
                  fromAmount: parseFloat(fromAmount),
                  toAmount: parseFloat(toAmount),
                  usdValue: fromUsdValue || 0,
                  txHash: signature,
                  walletAddress: publicKey.toString()
                });
              } catch (analyticsError) {
                console.error('Error recording analytics:', analyticsError);
              }
              
              setFromAmount('');
              setToAmount('');
              setFromUsdValue(null);
              setToUsdValue(null);
              setExchangeRate(null);
              setPriceImpact(null);
              
              fetchTokenBalances();
            } else {
              // Transaction is still processing
              setTxStatus('warning');
              setTxMessage(
                <div>
                  Transaction is still processing. Check status on{' '}
                  <a 
                    href={`https://solscan.io/tx/${signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'underline' }}
                  >
                    Solscan
                  </a>
                </div>
              );
            }
          } else {
            // We still don't have status - provide a link to check
            setTxStatus('warning');
            setTxMessage(
              <div>
                Transaction status unknown. Please check on{' '}
                <a 
                  href={`https://solscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3498db', textDecoration: 'underline' }}
                >
                  Solscan
                </a>
              </div>
            );
          }
        }
      } catch (statusError) {
        console.error('Error checking transaction status:', statusError);
        setTxStatus('error');
        setTxMessage(
          <div>
            Transaction verification failed. Please check on{' '}
            <a 
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3498db', textDecoration: 'underline' }}
            >
              Solscan
            </a>
          </div>
        );
      }
    } catch (err) {
      console.error('Swap failed:', err);
      setTxStatus('error');
      setError('Transaction failed: ' + (err.message || 'Unknown error'));
      setTxMessage('Transaction failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
    
    
    

    
  
// Updated createLimitOrder function
const createLimitOrder = async () => {
  if (!connected || !publicKey || !fromToken || !toToken || !fromAmount || !limitPrice) return;
  
  // Check minimum order size (5 USD)
  if (fromUsdValue < 5) {
    setError('Minimum order size is 5 USD');
    return;
  }

  setLoading(true);
  setTxStatus('processing');
  setTxMessage('Preparing limit order...');

  try {
    // Calculate exact amounts with proper decimal handling
    const makingAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
    
    // Calculate takingAmount based on the limit price
    // This is how much the user expects to receive
    const takingAmount = Math.floor(parseFloat(fromAmount) * parseFloat(limitPrice) * Math.pow(10, toToken.decimals));

    console.log('Creating limit order with:');
    console.log(`- Input: ${fromAmount} ${fromToken.symbol} (${makingAmount} base units)`);
    console.log(`- Expected output: ${parseFloat(fromAmount) * parseFloat(limitPrice)} ${toToken.symbol} (${takingAmount} base units)`);
    console.log(`- Price per ${fromToken.symbol}: ${limitPrice} ${toToken.symbol}`);

    const orderRequest = {
      inputMint: fromToken.address,
      outputMint: toToken.address,
      maker: publicKey.toString(),
      payer: publicKey.toString(),
      params: {
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString()
      },
      computeUnitPrice: "auto",
      wrapAndUnwrapSol: true
    };

    console.log('Order Request:', orderRequest);

    const response = await fetch('https://api.jup.ag/limit/v2/createOrder', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderRequest)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to create order');
    }

    const data = await response.json();
    console.log('API Response:', data);

// Deserialize and send the transaction
const transaction = VersionedTransaction.deserialize(Buffer.from(data.tx, 'base64'));

// Check which wallet is connected and use the appropriate method
let signature;
try {
  // Check if we're using Phantom specifically
  const isPhantomWallet = window.phantom && window.phantom.solana && window.phantom.solana.isConnected;
  
  if (isPhantomWallet) {
    // Use Phantom's native method
    console.log('Using Phantom native signAndSendTransaction');
    signature = await phantomSignAndSendTransaction(transaction);
  } else {
    // For all other wallets, use the wallet adapter
    console.log('Using wallet adapter sendTransaction for non-Phantom wallet');
    signature = await sendTransaction(transaction, connection);
  }
} catch (error) {
  console.error('Transaction signing failed:', error);
  throw error;
}
    
    console.log('Transaction sent with signature:', signature);
    
    // Wait for confirmation
    setTxMessage('Confirming transaction...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    setTxStatus('success');
    setTxMessage(`Limit order created! You will receive ${parseFloat(fromAmount) * parseFloat(limitPrice)} ${toToken.symbol} when your order is filled.`);
    
    // Record the order for analytics
    try {
      recordSwapForAnalytics({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(fromAmount) * parseFloat
        (limitPrice),
        usdValue: fromUsdValue || 0,
        txHash: signature,
        walletAddress: publicKey.toString(),
        orderType: 'limit'
      });
    } catch (analyticsError) {
      console.error('Error recording analytics:', analyticsError);
    }
    
    // Reset form
    setFromAmount('');
    setLimitPrice('');
    setSuccess(true);
    
    // Refresh balances
    if (typeof fetchTokenBalances === 'function') {
      fetchTokenBalances();
    } else {
      // If fetchTokenBalances is not defined, manually update balances
      if (connected && publicKey) {
        const fromBalance = await getTokenBalance(
          connection, 
          fromToken.address, 
          publicKey.toString()
        );
        setFromTokenBalance(fromBalance);
        
        const toBalance = await getTokenBalance(
          connection, 
          toToken.address, 
          publicKey.toString()
        );
        setToTokenBalance(toBalance);
      }
    }

  } catch (error) {
    console.error('Limit order failed:', error);
    setTxStatus('error');
    setError(`Order creation failed: ${error.message}`);
    setTxMessage(`Order creation failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};





  
  
// Token dropdown component
const TokenDropdown = ({ isFrom, isOpen, setIsOpen }) => {
  const currentToken = isFrom ? fromToken : toToken;
  
  // Filter tokens based on search query
  const searchResults = React.useMemo(() => {
    if (!searchQuery) return [];
    
    // Search in all tokens including imported tokens
    const allTokens = [...filteredTokens, ...customTokens];
    
    // Remove duplicates by address
    const uniqueTokens = Array.from(
      new Map(allTokens.map(token => [token.address, token])).values()
    );
    
    // Filter by search query
    const results = uniqueTokens.filter(token => 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase() === searchQuery.toLowerCase()
    );
    
    // Sort by relevance
    return results.sort((a, b) => {
      // Exact symbol match gets highest priority
      if (a.symbol.toLowerCase() === searchQuery.toLowerCase()) return -1;
      if (b.symbol.toLowerCase() === searchQuery.toLowerCase()) return 1;
      
      // Then sort by whether symbol starts with query
      const aStartsWith = a.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
      const bStartsWith = b.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return 0;
    });
  }, [filteredTokens, customTokens, searchQuery]);
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
          },
          width: '100%',
          justifyContent: 'flex-start'
        }}
      >
        {currentToken ? (
          <>
            <img 
              src={currentToken.image} 
              alt={currentToken.name} 
              style={{ width: 24, height: 24, borderRadius: '50%' }} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
              }}
            />
            <Typography>{currentToken.symbol}</Typography>
            {isCustomToken(currentToken.address) && (
              <Chip 
                size="small" 
                label="Imported" 
                color="primary" 
                variant="outlined" 
                sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} 
              />
            )}
          </>
        ) : (
          <Typography>Select token</Typography>
        )}
      </Button>
      
      {isOpen && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            // Position the dropdown above for TO token, below for FROM token
            ...(isFrom 
              ? { top: '100%', left: 0, mt: 1 } 
              : { bottom: '100%', left: 0, mb: 1 }),
            width: 380,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300, // Higher z-index to ensure it appears above other elements
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Select a token
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Search name, symbol, or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            {/* Search Results Section */}
            {searchQuery && searchResults.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Search Results
                </Typography>
                {searchResults.map((token) => (
                  <Box
                    key={token.address}
                    onClick={() => handleTokenSelect(token, isFrom)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <img 
                      src={token.image} 
                      alt={token.name} 
                      style={{ width: 32, height: 32, borderRadius: '50%' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                      }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{token.symbol}</Typography>
                        {isCustomToken(token.address) && (
                          <Chip 
                            size="small" 
                            label="Imported" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} 
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {token.name}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Import token section */}
            {importTokenInfo && (
              <Box 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  borderRadius: 2, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <img 
                    src={importTokenInfo.image} 
                    alt={importTokenInfo.name} 
                    style={{ width: 24, height: 24, borderRadius: '50%' }} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                    }}
                  />
                  <Box>
                    <Typography variant="body1">{importTokenInfo.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {importTokenInfo.symbol}
                      {importTokenInfo.fromCoinCodex && (
                        <Chip 
                          size="small" 
                          label="CoinCodex" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleImportToken(isFrom)}
                >
                  Import Token
                </Button>
              </Box>
            )}
            
            {/* Custom tokens section */}
            {customTokens.length > 0 && !searchQuery && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Imported Tokens
                </Typography>
                {customTokens.map((token) => (
                  <Box
                    key={token.address}
                    onClick={() => handleTokenSelect(token, isFrom)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <img 
                      src={token.image} 
                      alt={token.name} 
                      style={{ width: 32, height: 32, borderRadius: '50%' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                      }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{token.symbol}</Typography>
                        <Chip 
                          size="small" 
                          label="Imported" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {token.name}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
              </>
            )}
            
            {/* Token list - show popular tokens when not searching, show search results when searching */}
            {!searchQuery ? (
              // When not searching, show only popular tokens
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Popular Tokens
                </Typography>
                
                {tokensLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : popularTokens.length > 0 ? (
                  popularTokens.map((token) => (
                    <Box
                      key={token.address}
                      onClick={() => handleTokenSelect(token, isFrom)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <img 
                        src={token.image} 
                        alt={token.name} 
                        style={{ width: 32, height: 32, borderRadius: '50%' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                        }}
                      />
                      <Box>
                        <Typography variant="body1">{token.symbol}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {token.name}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }} color="text.secondary">
                    <Typography color="text.secondary">
                      No popular tokens found
                    </Typography>
                  </Box>
                )}
              </>
            ) : searchResults.length === 0 && (
              // No search results found
              <Box sx={{ p: 2, textAlign: 'center' }} color="text.secondary">
                <Typography color="text.secondary" gutterBottom>
                  No tokens found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                No results found. Try a different token symbol.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};




  
  // Import warning dialog
  const ImportWarningDialog = () => (
    <Dialog
      open={showImportWarning}
      onClose={() => setShowImportWarning(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Import Token</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {tokenToImport && (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Trade at your own risk!</AlertTitle>
              Anyone can create a token with any name, including fake versions of existing tokens. Learn about scams and security risks before proceeding.
            </Alert>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <img 
                src={tokenToImport.image} 
                alt={tokenToImport.name} 
                style={{ width: 40, height: 40, borderRadius: '50%' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                }}
              />
              <Box>
                <Typography variant="h6">{tokenToImport.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {tokenToImport.symbol}
                  {tokenToImport.fromCoinCodex && (
                    <Chip 
                      size="small" 
                      label="CoinCodex" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Address:</strong> {tokenToImport.address}
              </Typography>
              {tokenToImport.website && (
                <Typography variant="body2" gutterBottom>
                  <strong>Website:</strong> {tokenToImport.website}
                </Typography>
              )}
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={importConfirmed} 
                  onChange={(e) => setImportConfirmed(e.target.checked)} 
                />
              }
              label="I understand that this token may be a scam and I take full responsibility for my actions."
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowImportWarning(false)}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          disabled={!importConfirmed}
          onClick={() => confirmImportToken(true)}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' 
        : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="xl">
        <Header />

        <TrendingSolanaTokens />
        
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {/* Swap Form */}
          <Grid item xs={12} md={5} lg={4}>
            <Paper 
              elevation={0}
              className="glass"
              sx={{ 
                p: 4, 
                borderRadius: 4,
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1" fontWeight="bold">
                  Swap
                </Typography>
                
                <Tooltip title="Settings">
                  <IconButton onClick={() => setShowSettings(true)}>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Swap Tabs */}
              <Tabs 
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
              >
                <Tab value="market" label="Market" />
                <Tab value="limit" label="Limit" />
              </Tabs>
              
              {/* From token */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  mb: 1,
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    From
                  </Typography>
                  
                  {connected && fromToken && (
                    <Typography variant="body2" color="text.secondary">
                      Balance: {fromTokenBalance.toFixed(6)} {fromToken.symbol}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: '40%' }}>
                    <TokenDropdown 
                      isFrom={true} 
                      isOpen={isFromDropdownOpen} 
                      setIsOpen={setIsFromDropdownOpen} 
                    />
                  </Box>
                  
                  <TextField 
                    fullWidth
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => {
                      // Only allow numbers and decimals
                      const re = /^[0-9]*[.,]?[0-9]*$/;
                      if (e.target.value === '' || re.test(e.target.value)) {
                        setFromAmount(e.target.value);
                      }
                    }}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: connected && fromToken && (
                        <InputAdornment position="end">
                          <Button 
                            variant="text" 
                            size="small"
                            onClick={() => setFromAmount(fromTokenBalance.toString())}
                            sx={{ 
                              minWidth: 'auto',
                              color: theme.palette.primary.main,
                              fontWeight: 'bold',
                              p: 0
                            }}
                          >
                            MAX
                          </Button>
                        </InputAdornment>
                      ),
                      sx: { 
                        fontSize: '1.5rem',
                        fontWeight: 'medium',
                        '.MuiOutlinedInput-notchedOutline': { border: 'none' }
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                
                {fromUsdValue !== null && (
  <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
    ≈ {formatUsdValue(fromUsdValue)}
  </Typography>
)}

              </Paper>
              
              {/* Swap button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <IconButton 
                  onClick={handleSwapTokens}
                  sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.05)',
                    }
                  }}
                >
                  <SwapVertIcon />
                </IconButton>
              </Box>
              
              {/* To token */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  mb: 3,
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    To
                  </Typography>
                  
                  {connected && toToken && (
                    <Typography variant="body2" color="text.secondary">
                      Balance: {toTokenBalance.toFixed(6)} {toToken.symbol}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: '40%' }}>
                    <TokenDropdown 
                      isFrom={false} 
                      isOpen={isToDropdownOpen} 
                      setIsOpen={setIsToDropdownOpen} 
                    />
                  </Box>
                  
                  <TextField 
                    fullWidth
                    placeholder="0.0"
                    value={activeTab === 'market' ? toAmount : ''}
                    disabled={activeTab === 'market'}
                    InputProps={{
                      disableUnderline: true,
                      sx: { 
                        fontSize: '1.5rem',
                        fontWeight: 'medium',
                        '.MuiOutlinedInput-notchedOutline': { border: 'none' }
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                
                {toUsdValue !== null && activeTab === 'market' && (
  <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
    ≈ {formatUsdValue(toUsdValue)}
  </Typography>
)}

              </Paper>
              
              {/* Limit Price Input (only shown in limit tab) */}
              {activeTab === 'limit' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Limit Price (in {toToken?.symbol})
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder={`Enter price in ${toToken?.symbol}`}
                    value={limitPrice}
                    onChange={(e) => {
                      // Only allow numbers and decimals
                      const re = /^[0-9]*[.,]?[0-9]*$/;
                      if (e.target.value === '' || re.test(e.target.value)) {
                        setLimitPrice(e.target.value);
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="body2">{toToken?.symbol}</Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '.MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  {fromAmount && limitPrice && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      You will receive approximately {(parseFloat(fromAmount) * parseFloat(limitPrice)).toFixed(6)} {toToken?.symbol}
                    </Typography>
                  )}
                </Box>
              )}
              
            {/* Exchange rate info */}
{activeTab === 'market' && fromAmount && toAmount && (
  <SwapDetails
    fromToken={fromToken}
    toToken={toToken}
    exchangeRate={exchangeRate}
    priceImpact={priceImpact}
    slippage={slippage}
    networkFee={networkFee}
    route={route || [fromToken?.symbol, toToken?.symbol]} // Default to direct route if none provided
    markets={routeMarkets.length > 0 ? routeMarkets : ['Jupiter']} // Default to Jupiter if no specific markets
  />
)}

            
              {/* Action button */}
              {!connected ? (
                <WalletConnectButton 
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                  }}
                />
              ) : activeTab === 'market' ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!fromAmount || parseFloat(fromAmount) <= 0 || loading || parseFloat(fromAmount) > fromTokenBalance}
                  onClick={executeSwap}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                    '&.Mui-disabled': {
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.12)' 
                        : 'rgba(0, 0, 0, 0.12)',
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(0, 0, 0, 0.26)'
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : parseFloat(fromAmount) > fromTokenBalance ? (
                    'Insufficient Balance'
                  ) : (
                    'Swap'
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!fromAmount || !limitPrice || parseFloat(fromAmount) <= 0 || loading || parseFloat(fromAmount) > fromTokenBalance}
                    onClick={createLimitOrder}
                    sx={{ 
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                      '&.Mui-disabled': {
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.12)' 
                          : 'rgba(0, 0, 0, 0.12)',
                        color: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.26)'
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : parseFloat(fromAmount) > fromTokenBalance ? (
                      'Insufficient Balance'
                    ) : (
                      'Place Limit Order'
                    )}
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    component={Link}
                    to="/limit-orders"
                    sx={{ 
                      mt: 2,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                  >
                    View My Limit Orders
                  </Button>
                </>
              )}
            
              {/* Transaction Status */}
              {txStatus && (
                <Box 
                  sx={{ 
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 
                      txStatus === 'success' ? 'rgba(46, 204, 113, 0.1)' : 
                      txStatus === 'error' ? 'rgba(231, 76, 60, 0.1)' : 
                      'rgba(52, 152, 219, 0.1)',
                    border: '1px solid',
                    borderColor: 
                      txStatus === 'success' ? 'rgba(46, 204, 113, 0.3)' : 
                      txStatus === 'error' ? 'rgba(231, 76, 60, 0.3)' : 
                      'rgba(52, 152, 219, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {txStatus === 'processing' && <CircularProgress size={20} />}
                    {txStatus === 'success' && <CheckCircleIcon color="success" />}
                    {txStatus === 'error' && <WarningIcon color="error" />}
                    <Typography 
                      color={
                        txStatus === 'success' ? 'success.main' : 
                        txStatus === 'error' ? 'error.main' : 
                        'info.main'
                      }
                    >
                      {txMessage}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Trading View Chart */}
          <Grid item xs={12} md={7} lg={8}>
            <TradingViewChart fromToken={fromToken} toToken={toToken} />
          </Grid>
        </Grid>
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
          {activeTab === 'market' ? 'Swap completed successfully!' : 'Limit order placed successfully!'}
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
      
      {/* Import warning dialog */}
      <ImportWarningDialog />
      
      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Settings</Typography>
            <IconButton onClick={() => setShowSettings(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Slippage Tolerance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Button 
              variant={slippage === 0.1 ? "contained" : "outlined"}
              size="small"
              onClick={() => setSlippage(0.1)}
              sx={{ borderRadius: 2 }}
            >
              0.1%
            </Button>
            <Button 
              variant={slippage === 0.5 ? "contained" : "outlined"}
              size="small"
              onClick={() => setSlippage(0.5)}
              sx={{ borderRadius: 2 }}
            >
              0.5%
            </Button>
            <Button 
              variant={slippage === 1.0 ? "contained" : "outlined"}
              size="small"
              onClick={() => setSlippage(1.0)}
              sx={{ borderRadius: 2 }}
            >
              1.0%
            </Button>
            <TextField
              size="small"
              value={customSlippage !== null ? customSlippage : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setCustomSlippage(value);
                  if (value !== '') {
                    setSlippage(parseFloat(value));
                  }
                }
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                sx: { borderRadius: 2 }
              }}
              placeholder="Custom"
              sx={{ width: 100 }}
            />
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Transaction Deadline
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              value={txDeadline}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*$/.test(value)) {
                  setTxDeadline(value);
                }
              }}
              sx={{ width: 80 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <Typography variant="body2" color="text.secondary">
              minutes
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Routes dialog */}
      <Dialog
        open={showRoutesDialog}
        onClose={() => setShowRoutesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Available Routes</Typography>
        </DialogTitle>
        <DialogContent>
          {availableRoutes.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Output</TableCell>
                    <TableCell>Price Impact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableRoutes.map((route, index) => (
                    <TableRow 
                      key={index}
                      selected={selectedRouteIndex === index}
                      onClick={() => setSelectedRouteIndex(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Radio
                          checked={selectedRouteIndex === index}
                          onChange={() => setSelectedRouteIndex(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          {route.marketInfos.map((market, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <ArrowRightAltIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                              <Chip 
                                label={formatMarketName(market.label)} 
                                size="small" 
                                variant="outlined"
                              />
                            </React.Fragment>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {(route.outAmount / Math.pow(10, toToken?.decimals || 9)).toFixed(6)} {toToken?.symbol}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          color={route.priceImpactPct > 1 ? 'error.main' : 'success.main'}
                        >
                          {(route.priceImpactPct * 100).toFixed(2)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No routes available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoutesDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Apply selected route
              setShowRoutesDialog(false);
            }}
            disabled={availableRoutes.length === 0}
          >
            Select Route
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SwapPage;









  







