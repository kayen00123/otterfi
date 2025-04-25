import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Fetch token info from GeckoTerminal or Jupiter
 * @param {string} address - Solana token address
 * @returns {Promise<Object|null>} Token info or null if not found
 */
export const fetchTokenInfo = async (address) => {
  try {
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.data) {
      const tokenData = data.data.attributes;
      return {
        address: address,
        symbol: tokenData.symbol.toUpperCase(),
        name: tokenData.name,
        decimals: 9,
        image: tokenData.image_url,
        volume24h: tokenData.volume_24h || 0,
        liquidity: tokenData.liquidity_usd || 0,
        price: tokenData.price_usd || 0,
        priceChange24h: tokenData.price_change_24h || 0
      };
    }

    // Fallback to Jupiter if token not found
    const jupiterResponse = await fetch('https://cache.jup.ag/tokens');
    const jupiterTokens = await jupiterResponse.json();
    const jupiterToken = jupiterTokens.find(t => t.address === address);

    if (jupiterToken) {
      return {
        address: jupiterToken.address,
        symbol: jupiterToken.symbol,
        name: jupiterToken.name,
        decimals: jupiterToken.decimals,
        image: jupiterToken.logoURI,
        volume24h: 0,
        liquidity: 0,
        price: 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
};

/**
 * Validate if a string is a valid Solana address
 * @param {string} address - Address to validate
 * @returns {boolean} Whether the address is valid
 */
export const validateSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get token balance for a wallet
 * @param {Connection} connection - Solana connection
 * @param {string} tokenAddress - Token address
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<number>} Token balance
 */
export const getTokenBalance = async (connection, tokenAddress, walletAddress) => {
  try {
    // Handle SOL native token
    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      return balance / 1e9; // Convert lamports to SOL
    }
    
    const mintPubkey = new PublicKey(tokenAddress);
    const walletPubkey = new PublicKey(walletAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey
    });

    if (tokenAccounts.value.length > 0) {
      return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
};

/**
 * Search for Solana tokens by symbol
 * @param {string} query - Search query (symbol)
 * @returns {Promise<Array>} Array of matching tokens
 */
export const searchSolanaTokensBySymbol = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    // Normalize the query to uppercase for case-insensitive comparison
    const normalizedQuery = query.toUpperCase();
    
    // Fetch tokens from Jupiter (which are all Solana tokens)
    const jupiterResponse = await fetch('https://cache.jup.ag/tokens');
    const jupiterTokens = await jupiterResponse.json();
    
    // Filter tokens by symbol match
    const matchingTokens = jupiterTokens.filter(token => 
      token.symbol.toUpperCase().includes(normalizedQuery) ||
      token.name.toUpperCase().includes(normalizedQuery)
    );
    
    // Sort by exact match first, then by symbol length (shorter first)
    return matchingTokens.sort((a, b) => {
      // Exact symbol match gets highest priority
      if (a.symbol.toUpperCase() === normalizedQuery) return -1;
      if (b.symbol.toUpperCase() === normalizedQuery) return 1;
      
      // Then sort by whether symbol starts with query
      const aStartsWith = a.symbol.toUpperCase().startsWith(normalizedQuery);
      const bStartsWith = b.symbol.toUpperCase().startsWith(normalizedQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then sort by symbol length (shorter first)
      return a.symbol.length - b.symbol.length;
    });
  } catch (error) {
    console.error('Error searching Solana tokens:', error);
    return [];
  }
};

/**
 * Fetch token from CoinCodex ensuring it's a Solana token
 * @param {string} symbol - Token symbol
 * @returns {Promise<Object|null>} Token data or null if not found
 */
export const fetchSolanaTokenFromCoinCodex = async (symbol) => {
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
    
    // Check if the token has a Solana address - this is crucial
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
      fromCoinCodex: true, // Flag to indicate this token came from CoinCodex
      isSolanaToken: true // Explicitly mark as Solana token
    };
  } catch (error) {
    console.error('Error fetching token from CoinCodex:', error);
    return null;
  }
};

/**
 * Combine search results from multiple sources, ensuring only Solana tokens
 * @param {string} query - Search query
 * @returns {Promise<Array>} Combined search results
 */
export const searchTokens = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    // First search in Jupiter tokens (all Solana tokens)
    const jupiterTokens = await searchSolanaTokensBySymbol(query);
    
    // If we have a valid address, try to fetch token info
    if (validateSolanaAddress(query)) {
      const tokenInfo = await fetchTokenInfo(query);
      if (tokenInfo && !jupiterTokens.some(t => t.address === query)) {
        jupiterTokens.push(tokenInfo);
      }
    }
    
    // If we have few results, try CoinCodex but only for Solana tokens
    if (jupiterTokens.length < 5) {
      const coinCodexToken = await fetchSolanaTokenFromCoinCodex(query);
      if (coinCodexToken && !jupiterTokens.some(t => t.address === coinCodexToken.address)) {
        jupiterTokens.push(coinCodexToken);
      }
    }
    
    return jupiterTokens;
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
};
