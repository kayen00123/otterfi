import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Typography, Paper, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, Alert, Button, Chip
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import Header from '../components/Header';
import WalletConnectButton from '../components/WalletConnectButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Cache for token data
const tokenCache = {};

// Map of Solana token addresses to Coinpaprika IDs
const tokenAddressToCoinpaprikaId = {
  'So11111111111111111111111111111111111111112': 'sol-solana', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usdc-usd-coin', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'usdt-tether', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk-bonk', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'jup-jupiter', // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'wif-dogwifhat', // WIF
  // Add more mappings as needed
};

// Map of Solana token addresses to symbols
const tokenAddressToSymbol = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
  // Add more mappings as needed
};

// Known token decimals for common tokens
const KNOWN_TOKEN_DECIMALS = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6, // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 6, // WIF
};

// Global variable to store Coinpaprika data
let coinpaprikaData = null;
let lastCoinpaprikaFetch = 0;

// Global variable to store Jupiter price data
let jupiterPriceData = null;
let lastJupiterPriceFetch = 0;

const PortfolioPage = () => {
  const theme = useTheme();
  const { connected, publicKey } = useWallet();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [solBalance, setSolBalance] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [solChange24h, setSolChange24h] = useState(null);
  const [solChange1h, setSolChange1h] = useState(null);
  
  // Reference to track if initial fetch has been done
  const initialFetchDone = useRef(false);
  
  // Create a Solana connection
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=887a40ac-2f47-4df7-bc37-1b9589ba5a48', 'confirmed');
  
  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 0.01 ? 6 : 2
    }).format(value);
  };
  
  // Format token amount
  const formatTokenAmount = (amount, decimals = 4) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: amount < 0.01 ? 8 : decimals
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };
  
  // Fetch all token data from Coinpaprika
  const fetchCoinpaprikaData = async () => {
    const now = Date.now();
    // Only fetch if data is older than 5 minutes
    if (coinpaprikaData && now - lastCoinpaprikaFetch < 300000) {
      console.log("Using cached Coinpaprika data");
      return coinpaprikaData;
    }
    
    try {
      console.log("Fetching data from Coinpaprika...");
      
      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://api.coinpaprika.com/v1/tickers', {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Coinpaprika API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Coinpaprika data received: ${data.length} tokens`);
      
      // Create a map for faster lookups
      const dataMap = {};
      data.forEach(token => {
        dataMap[token.id] = token;
        // Also map by symbol for fallback lookups
        dataMap[token.symbol.toLowerCase()] = token;
      });
      
      // Cache the data
      coinpaprikaData = dataMap;
      lastCoinpaprikaFetch = now;
      
      return dataMap;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Coinpaprika request timed out');
      } else {
        console.error('Error fetching from Coinpaprika:', error);
      }
      
      // Return empty object if we have no data
      return coinpaprikaData || {};
    }
  };
  
  // Fetch price data from Jupiter
  const fetchJupiterPriceData = async (tokenAddresses = []) => {
    const now = Date.now();
    // Only fetch if data is older than 2 minutes or if we're requesting specific tokens
    if (jupiterPriceData && now - lastJupiterPriceFetch < 120000 && tokenAddresses.length === 0) {
      console.log("Using cached Jupiter price data");
      return jupiterPriceData;
    }
    
    try {
      // If specific tokens are requested, fetch only those
      const endpoint = tokenAddresses.length > 0 
        ? `https://api.jup.ag/price/v2?ids=${tokenAddresses.join(',')}`
        : 'https://api.jup.ag/price/v2';
      
      console.log(`Fetching price data from Jupiter: ${endpoint}`);
      
      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(endpoint, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Jupiter API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Jupiter price data received for ${Object.keys(data.data || {}).length} tokens`);
      
      // If we're fetching all tokens, cache the result
      if (tokenAddresses.length === 0) {
        jupiterPriceData = data.data || {};
        lastJupiterPriceFetch = now;
        return jupiterPriceData;
      }
      
      // Otherwise just return the data without caching
      return data.data || {};
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Jupiter price request timed out');
      } else {
        console.error('Error fetching from Jupiter price API:', error);
      }
      
      // Return empty object if we have no data
      return tokenAddresses.length === 0 ? (jupiterPriceData || {}) : {};
    }
  };
  
  // Fetch token info from GeckoTerminal API (for token metadata only)
  const fetchGeckoTerminalInfo = async (address) => {
    try {
      console.log(`Fetching GeckoTerminal data for ${address}...`);
      
      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`GeckoTerminal API returned ${response.status} for address ${address}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`GeckoTerminal data received for ${address}`);
      
      if (data && data.data && data.data.attributes) {
        const tokenData = data.data.attributes;
        
        return {
          name: tokenData.name || null,
          symbol: tokenData.symbol ? tokenData.symbol.toUpperCase() : null,
          logo: tokenData.image_url || null
        };
      }
      
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`GeckoTerminal request for ${address} timed out`);
      } else {
        console.error(`Error fetching from GeckoTerminal for ${address}:`, error);
      }
      return null;
    }
  };
  
  // Fetch token info from Jupiter API (for token metadata only)
  const fetchJupiterTokenInfo = async (address) => {
    try {
      console.log(`Fetching Jupiter token info for ${address}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://cache.jup.ag/tokens', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Jupiter API returned ${response.status}`);
      }
      
      const data = await response.json();
      const token = data.find(t => t.address === address);
      
      if (token) {
        return {
          name: token.name,
          symbol: token.symbol,
          logo: token.logoURI
        };
      }
      
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Jupiter request for ${address} timed out`);
      } else {
        console.error('Error fetching Jupiter token info:', error);
      }
      return null;
    }
  };
  
  // Get token price and changes from Coinpaprika data
  const getTokenPriceData = (address, coinpaprikaData, jupiterPriceData) => {
    // Try to get the Coinpaprika ID for this token
    const coinpaprikaId = tokenAddressToCoinpaprikaId[address];
    
    if (coinpaprikaId && coinpaprikaData[coinpaprikaId]) {
      const tokenData = coinpaprikaData[coinpaprikaId];
      return {
        price: tokenData.quotes.USD.price,
        priceChange1h: tokenData.quotes.USD.percent_change_1h,
        priceChange24h: tokenData.quotes.USD.percent_change_24h,
        source: 'coinpaprika'
      };
    }
    
    // Try to match by symbol as a fallback in Coinpaprika
    const symbol = tokenAddressToSymbol[address];
    if (symbol && coinpaprikaData[symbol.toLowerCase()]) {
      const tokenData = coinpaprikaData[symbol.toLowerCase()];
      return {
        price: tokenData.quotes.USD.price,
        priceChange1h: tokenData.quotes.USD.percent_change_1h,
        priceChange24h: tokenData.quotes.USD.percent_change_24h,
        source: 'coinpaprika'
      };
    }
    
    // If not found in Coinpaprika, try Jupiter price API
    if (jupiterPriceData && jupiterPriceData[address]) {
      const jupiterData = jupiterPriceData[address];
      return {
        price: parseFloat(jupiterData.price) || 0,
        priceChange1h: null, // Jupiter doesn't provide hourly change
        priceChange24h: jupiterData.price_24h ? 
          ((parseFloat(jupiterData.price) / parseFloat(jupiterData.price_24h) - 1) * 100) : null,
        source: 'jupiter'
      };
    }
    
    // Return default values if no match found
    return {
      price: 0,
      priceChange1h: null,
      priceChange24h: null,
      source: 'none'
    };
  };
  
  // Fetch token info efficiently
  const fetchTokenInfo = async (address) => {
    // Return from cache if available and not expired
    const now = Date.now();
    if (tokenCache[address] && now - tokenCache[address].timestamp < 300000) { // 5 minutes
      console.log(`Using cached data for ${address}`);
      return tokenCache[address];
    }
    
    try {
      console.log(`Fetching token info for ${address}...`);
      
      // Get Coinpaprika data for price and changes
      const paprikaData = await fetchCoinpaprikaData();
      
      // Get Jupiter price data specifically for this token
      const jupiterData = await fetchJupiterPriceData([address]);
      
      // Combine data sources for price
      const priceData = getTokenPriceData(address, paprikaData, jupiterData);
      
      // Get token metadata from GeckoTerminal
      const geckoData = await fetchGeckoTerminalInfo(address);
      
      // Fallback to Jupiter for metadata if GeckoTerminal fails
      let jupiterMetadata = null;
      if (!geckoData || !geckoData.name || !geckoData.symbol) {
        jupiterMetadata = await fetchJupiterTokenInfo(address);
      }
      
      // Construct the result using the best available data
      const result = {
        address: address,
        symbol: geckoData?.symbol || jupiterMetadata?.symbol || tokenAddressToSymbol[address] || 'Unknown',
        name: geckoData?.name || jupiterMetadata?.name || 'Unknown Token',
        logo: geckoData?.logo || jupiterMetadata?.logo || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        price: priceData.price,
        priceChange1h: priceData.priceChange1h,
        priceChange24h: priceData.priceChange24h,
        priceSource: priceData.source,
        timestamp: now
      };
      
      // Cache the result
      tokenCache[address] = result;
      return result;
    } catch (error) {
      console.error(`Error fetching token info for ${address}:`, error);
      
      // Return a default object so we don't break the whole list
      return {
        address: address,
        symbol: tokenAddressToSymbol[address] || 'Unknown',
        name: 'Error loading token',
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        price: 0,
        priceChange1h: null,
        priceChange24h: null,
        priceSource: 'error',
        timestamp: Date.now()
      };
    }
  };
  
  // Fetch token balances
  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!connected || !publicKey) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Starting to fetch token balances...");
        
        // Fetch SOL balance
        const solBal = await connection.getBalance(publicKey);
        const solBalanceInSOL = solBal / 1e9;
        setSolBalance(solBalanceInSOL);
        console.log("SOL balance fetched:", solBalanceInSOL);
        
        // Fetch Coinpaprika data for all tokens
        const paprikaData = await fetchCoinpaprikaData();
        
        // Fetch Jupiter price data for all tokens
        const jupiterData = await fetchJupiterPriceData();
        
        // Get SOL price data
        const solPriceData = getTokenPriceData('So11111111111111111111111111111111111111112', paprikaData, jupiterData);
        setSolPrice(solPriceData.price);
        setSolChange24h(solPriceData.priceChange24h);
        setSolChange1h(solPriceData.priceChange1h);
        console.log("SOL price data:", solPriceData);
        
        // Fetch token accounts
        console.log("Fetching token accounts...");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        console.log("Token accounts fetched:", tokenAccounts.value.length);
        
        // Filter and format token data
        const tokenData = tokenAccounts.value
          .filter(account => {
            const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
            return amount > 0;
          })
          .map(account => {
            const { mint, tokenAmount } = account.account.data.parsed.info;
            return {
              mint,
              amount: tokenAmount.uiAmount,
              decimals: tokenAmount.decimals
            };
          });
        
        console.log("Filtered token data:", tokenData.length);
        
        // Process tokens in small batches to avoid rate limits
        const enrichedTokens = [];
        const batchSize = 5; // We can use larger batches since we're using a single API call
        
        for (let i = 0; i < tokenData.length; i += batchSize) {
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(tokenData.length/batchSize)}`);
          const batch = tokenData.slice(i, i + batchSize);
          const batchPromises = batch.map(async (token) => {
            try {
              const tokenInfo = await fetchTokenInfo(token.mint);
              
              return {
                ...token,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                logo: tokenInfo.logo,
                price: tokenInfo.price,
                priceChange1h: tokenInfo.priceChange1h,
                priceChange24h: tokenInfo.priceChange24h,
                priceSource: tokenInfo.priceSource,
                value: token.amount * tokenInfo.price
              };
            } catch (tokenError) {
              console.error(`Error processing token ${token.mint}:`, tokenError);
              // Return a default object so we don't break the whole list
              return {
                ...token,
                symbol: tokenAddressToSymbol[token.mint] || 'Unknown',
                name: 'Error loading token',
                logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
                price: 0,
                priceChange1h: null,
                priceChange24h: null,
                priceSource: 'error',
                value: 0
              };
            }
          });
          
          try {
            const batchResults = await Promise.all(batchPromises);
            enrichedTokens.push(...batchResults);
          } catch (batchError) {
            console.error("Error processing batch:", batchError);
          }
          
          // Small delay between batches
          if (i + batchSize < tokenData.length) {
            console.log("Waiting between batches...");
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log("All tokens processed:", enrichedTokens.length);
        
        // Sort tokens by value
        const sortedTokens = enrichedTokens.sort((a, b) => b.value - a.value);
        
        // Add SOL as the first token
        const allTokens = [
          {
            mint: 'So11111111111111111111111111111111111111112',
            amount: solBalanceInSOL,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
            logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
            price: solPriceData.price,
            priceChange1h: solPriceData.priceChange1h,
            priceChange24h: solPriceData.priceChange24h,
            priceSource: solPriceData.source,
            value: solBalanceInSOL * solPriceData.price
          },
          ...sortedTokens
        ].sort((a, b) => b.value - a.value);
        
        console.log("Setting tokens in state:", allTokens.length);
        setTokens(allTokens);
      } catch (error) {
        console.error('Error fetching token balances:', error);
        setError('Failed to load your portfolio. Please try again later.');
        // Set tokens to empty array to ensure we exit loading state
        setTokens([]);
      } finally {
        console.log("Finished fetching token balances");
        setLoading(false);
        initialFetchDone.current = true;
      }
    };
    
    if (connected && publicKey && (!initialFetchDone.current || tokens.length === 0)) {
      fetchTokenBalances();
    } else if (!connected) {
      setTokens([]);
      setLoading(false);
    }
  }, [connected, publicKey]); // Remove connection from dependencies
  
  // Calculate total portfolio value
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  
  // Handle refresh
  const handleRefresh = () => {
    if (connected && publicKey) {
      setLoading(true);
      // Clear cache to force fresh data
      Object.keys(tokenCache).forEach(key => delete tokenCache[key]);
      // Force refresh of Coinpaprika data
      lastCoinpaprikaFetch = 0;
      coinpaprikaData = null;
      // Force refresh of Jupiter price data
      lastJupiterPriceFetch = 0;
      jupiterPriceData = null;
      initialFetchDone.current = false;
      
      // Re-fetch token balances
      const fetchData = async () => {
        try {
          // Fetch SOL balance
          const solBal = await connection.getBalance(publicKey);
          const solBalanceInSOL = solBal / 1e9;
          setSolBalance(solBalanceInSOL);
          
          // Fetch Coinpaprika data for all tokens
          const paprikaData = await fetchCoinpaprikaData();
          
          // Fetch Jupiter price data for all tokens
          const jupiterData = await fetchJupiterPriceData();
          
          // Get SOL price data
          const solPriceData = getTokenPriceData('So11111111111111111111111111111111111111112', paprikaData, jupiterData);
          setSolPrice(solPriceData.price);
          setSolChange24h(solPriceData.priceChange24h);
          setSolChange1h(solPriceData.priceChange1h);
          
          // Fetch token accounts
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
          );
          
          // Filter and format token data
          const tokenData = tokenAccounts.value
            .filter(account => {
              const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
              return amount > 0;
            })
            .map(account => {
              const { mint, tokenAmount } = account.account.data.parsed.info;
              return {
                mint,
                amount: tokenAmount.uiAmount,
                decimals: tokenAmount.decimals
              };
            });
          
          // Process tokens in small batches to avoid rate limits
          const enrichedTokens = [];
          const batchSize = 5;
          
          for (let i = 0; i < tokenData.length; i += batchSize) {
            const batch = tokenData.slice(i, i + batchSize);
            const batchPromises = batch.map(async (token) => {
              try {
                const tokenInfo = await fetchTokenInfo(token.mint);
                
                return {
                  ...token,
                  symbol: tokenInfo.symbol,
                  name: tokenInfo.name,
                  logo: tokenInfo.logo,
                  price: tokenInfo.price,
                  priceChange1h: tokenInfo.priceChange1h,
                  priceChange24h: tokenInfo.priceChange24h,
                  priceSource: tokenInfo.priceSource,
                  value: token.amount * tokenInfo.price
                };
              } catch (tokenError) {
                console.error(`Error processing token ${token.mint}:`, tokenError);
                return {
                  ...token,
                  symbol: tokenAddressToSymbol[token.mint] || 'Unknown',
                  name: 'Error loading token',
                  logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
                  price: 0,
                  priceChange1h: null,
                  priceChange24h: null,
                  priceSource: 'error',
                  value: 0
                };
              }
            });
            
            try {
              const batchResults = await Promise.all(batchPromises);
              enrichedTokens.push(...batchResults);
            } catch (batchError) {
              console.error("Error processing batch:", batchError);
            }
            
            if (i + batchSize < tokenData.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // Sort tokens by value
          const sortedTokens = enrichedTokens.sort((a, b) => b.value - a.value);
          
          // Add SOL as the first token
          const allTokens = [
            {
              mint: 'So11111111111111111111111111111111111111112',
              amount: solBalanceInSOL,
              decimals: 9,
              symbol: 'SOL',
              name: 'Solana',
              logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
              price: solPriceData.price,
              priceChange1h: solPriceData.priceChange1h,
              priceChange24h: solPriceData.priceChange24h,
              priceSource: solPriceData.source,
              value: solBalanceInSOL * solPriceData.price
            },
            ...sortedTokens
          ].sort((a, b) => b.value - a.value);
          
          setTokens(allTokens);
        } catch (error) {
          console.error('Error refreshing token balances:', error);
          setError('Failed to refresh your portfolio. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Simple Portfolio
            </Typography>
            
            {connected && (
              <Button 
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
            )}
          </Box>
          
          {!connected ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 4,
                textAlign: 'center',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Connect your wallet to view your portfolio
              </Typography>
              <Box sx={{ mt: 2 }}>
                <WalletConnectButton 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    fontSize: '1rem',
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                  }}
                />
              </Box>
            </Paper>
          ) : loading ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading your portfolio...
              </Typography>
            </Paper>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 4 }}>
              {error}
            </Alert>
          ) : tokens.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 4,
                textAlign: 'center',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }}
            >
              <Typography variant="h6" gutterBottom>
                No tokens found in your wallet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your connected wallet doesn't have any tokens yet.
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Typography variant="h5" gutterBottom>
                  Total Value: {formatCurrency(totalValue)}
                </Typography>
              </Paper>
              
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">1h Change</TableCell>
                      <TableCell align="right">24h Change</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.mint}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img 
                              src={token.logo} 
                              alt={token.symbol} 
                              style={{ width: 24, height: 24, borderRadius: '50%' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                              }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {token.symbol}
                                {token.priceSource === 'jupiter' && (
                                  <Chip 
                                    size="small" 
                                    label="Jupiter" 
                                    sx={{ 
                                      ml: 1, 
                                      height: 16, 
                                      fontSize: '0.6rem',
                                      backgroundColor: theme.palette.mode === 'dark' ? '#1a237e' : '#e3f2fd',
                                      color: theme.palette.mode === 'dark' ? '#fff' : '#0d47a1'
                                    }} 
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {token.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(token.price)}
                        </TableCell>
                        <TableCell align="right">
                          {token.priceChange1h !== null ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {token.priceChange1h > 0 ? (
                                <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                              ) : token.priceChange1h < 0 ? (
                                <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                              ) : null}
                              <Typography 
                                variant="body2" 
                                color={token.priceChange1h > 0 ? 'success.main' : token.priceChange1h < 0 ? 'error.main' : 'text.secondary'}
                              >
                                {formatPercentage(token.priceChange1h)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {token.priceChange24h !== null ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {token.priceChange24h > 0 ? (
                                <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                              ) : token.priceChange24h < 0 ? (
                                <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                              ) : null}
                              <Typography 
                                variant="body2" 
                                color={token.priceChange24h > 0 ? 'success.main' : token.priceChange24h < 0 ? 'error.main' : 'text.secondary'}
                              >
                                {formatPercentage(token.priceChange24h)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatTokenAmount(token.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(token.value)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default PortfolioPage;



    







