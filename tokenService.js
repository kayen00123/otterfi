// Simple token service for fetching price data with caching

const CG_API_KEY = 'CG-hsuSjULFZMqkxMbs2f6TxDb1';
const CG_API_URL = 'https://api.coingecko.com/api/v3';

// Cache for token prices
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetch token prices from CoinGecko with caching
 * @param {Array<string>} tokenIds - Array of CoinGecko token IDs
 * @returns {Promise<Object>} Token price data
 */
export const fetchTokenPrices = async (tokenIds = ['solana']) => {
  const now = Date.now();
  
  // If cache is valid and we have all requested tokens, return cached data
  if (now - lastFetchTime < CACHE_DURATION && 
      tokenIds.every(id => priceCache[id])) {
    console.log('Using cached price data');
    return priceCache;
  }
  
  try {
    console.log('Fetching fresh price data from CoinGecko');
    const response = await fetch(
      `${CG_API_URL}/coins/markets?vs_currency=usd&ids=${tokenIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
      {
        headers: {
          'x-cg-api-key': CG_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to a more usable format
    const newPriceData = data.reduce((acc, coin) => {
      acc[coin.id] = {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume: coin.total_volume,
        image: coin.image
      };
      return acc;
    }, {});
    
    // Update cache
    priceCache = { ...priceCache, ...newPriceData };
    lastFetchTime = now;
    
    return priceCache;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    // Return cached data if available, even if expired
    if (Object.keys(priceCache).length > 0) {
      return priceCache;
    }
    return {};
  }
};

/**
 * Map Solana token addresses to CoinGecko IDs
 * This is a simplified mapping - in a production app, you'd have a more comprehensive list
 */
export const SOLANA_TOKEN_TO_COINGECKO = {
  'So11111111111111111111111111111111111111112': 'solana',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'raydium'
};

/**
 * Get CoinGecko ID for a Solana token address
 * @param {string} tokenAddress - Solana token address
 * @returns {string|null} CoinGecko ID or null if not found
 */
export const getCoinGeckoId = (tokenAddress) => {
  return SOLANA_TOKEN_TO_COINGECKO[tokenAddress] || null;
};
