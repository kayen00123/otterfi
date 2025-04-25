/**
 * Analytics Service for tracking DEX transactions
 * Stores data in localStorage for simplicity
 */

// Test localStorage availability
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('ANALYTICS: localStorage is available and working');
  } catch (e) {
    console.error('ANALYTICS: localStorage is not available:', e);
  }
  
  // Constants
  const STORAGE_KEYS = {
    TRANSACTIONS: 'solanatrade_transactions',
    DAILY_VOLUMES: 'solanatrade_daily_volumes',
    PAIRS_VOLUME: 'solanatrade_pairs_volume'
  };
  
  /**
   * Record a new transaction
   * @param {Object} transaction - Transaction details
   * @param {string} transaction.fromToken - From token symbol
   * @param {string} transaction.toToken - To token symbol
   * @param {number} transaction.fromAmount - Amount of from token
   * @param {number} transaction.toAmount - Amount of to token
   * @param {number} transaction.usdValue - USD value of the transaction
   * @param {string} transaction.txHash - Transaction hash
   * @param {string} transaction.walletAddress - User's wallet address
   */
  export const recordTransaction = (transaction) => {
    try {
      console.log('ANALYTICS: Recording transaction with data:', transaction);
      
      // Validate required fields
      if (!transaction.fromToken || !transaction.toToken || !transaction.txHash) {
        console.error('ANALYTICS: Missing required transaction fields');
        return;
      }
      
      // Ensure usdValue is a number
      const usdValue = typeof transaction.usdValue === 'number' ? 
        transaction.usdValue : 
        (parseFloat(transaction.usdValue) || 0);
      
      // Add timestamp
      const txWithTimestamp = {
        ...transaction,
        usdValue,
        timestamp: Date.now()
      };
      
      // Get existing transactions
      const existingTxs = getTransactions();
      
      // Check if this transaction has already been recorded (prevent duplicates)
      if (existingTxs.some(tx => tx.txHash === transaction.txHash)) {
        console.log('ANALYTICS: Transaction already recorded, skipping');
        return;
      }
      
      // Add new transaction
      existingTxs.push(txWithTimestamp);
      
      // Save back to storage
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(existingTxs));
      console.log('ANALYTICS: Transaction saved to localStorage');
      
      // Update daily volumes
      updateDailyVolume(usdValue);
      
      // Update pairs volume
      updatePairsVolume(
        txWithTimestamp.fromToken, 
        txWithTimestamp.toToken, 
        usdValue
      );
    } catch (error) {
      console.error('Error recording transaction for analytics:', error);
    }
  };
  
  /**
   * Get all recorded transactions
   * @returns {Array} Array of transactions
   */
  export const getTransactions = () => {
    try {
      const txs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return txs ? JSON.parse(txs) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  };
  
  /**
   * Update daily volume tracking
   * @param {number} usdValue - USD value to add
   */
  const updateDailyVolume = (usdValue) => {
    try {
      // Get existing daily volumes
      const dailyVolumes = getDailyVolumes();
      
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
      
      // Keep only last 30 days
      const last30Days = dailyVolumes
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);
      
      // Save back to storage
      localStorage.setItem(STORAGE_KEYS.DAILY_VOLUMES, JSON.stringify(last30Days));
      console.log('ANALYTICS: Daily volume updated');
    } catch (error) {
      console.error('Error updating daily volume:', error);
    }
  };
  
  /**
   * Get daily volumes
   * @returns {Array} Array of daily volumes
   */
  export const getDailyVolumes = () => {
    try {
      const volumes = localStorage.getItem(STORAGE_KEYS.DAILY_VOLUMES);
      return volumes ? JSON.parse(volumes) : [];
    } catch (error) {
      console.error('Error getting daily volumes:', error);
      return [];
    }
  };
  
  /**
   * Update pairs volume tracking
   * @param {string} fromToken - From token symbol
   * @param {string} toToken - To token symbol
   * @param {number} usdValue - USD value to add
   */
  const updatePairsVolume = (fromToken, toToken, usdValue) => {
    try {
      // Get existing pairs volume
      const pairsVolume = getPairsVolume();
      
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
      localStorage.setItem(STORAGE_KEYS.PAIRS_VOLUME, JSON.stringify(pairsVolume));
      console.log('ANALYTICS: Pairs volume updated');
    } catch (error) {
      console.error('Error updating pairs volume:', error);
    }
  };
  
  /**
   * Get pairs volume
   * @returns {Array} Array of pairs volume
   */
  export const getPairsVolume = () => {
    try {
      const volumes = localStorage.getItem(STORAGE_KEYS.PAIRS_VOLUME);
      return volumes ? JSON.parse(volumes) : [];
    } catch (error) {
      console.error('Error getting pairs volume:', error);
      return [];
    }
  };
  
  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  export const getAnalyticsSummary = () => {
    try {
      const transactions = getTransactions();
      const dailyVolumes = getDailyVolumes();
      const pairsVolume = getPairsVolume();
      
      console.log('ANALYTICS: Raw data from localStorage:', {
        transactions: transactions.length,
        dailyVolumes: dailyVolumes.length,
        pairsVolume: pairsVolume.length
      });
      
      // Calculate total volume
      const totalVolume = transactions.reduce((sum, tx) => sum + (tx.usdValue || 0), 0);
      
      // Calculate 24h volume
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const volume24h = transactions
        .filter(tx => tx.timestamp >= oneDayAgo)
        .reduce((sum, tx) => sum + (tx.usdValue || 0), 0);
      
      // Calculate 24h transactions count
      const transactions24h = transactions.filter(tx => tx.timestamp >= oneDayAgo).length;
      
      // Get top pairs by volume
      const topPairs = [...pairsVolume]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);
      
      // Get last 7 days volume
      const last7Days = dailyVolumes
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7)
        .reverse();
      
      // Fill in missing days with zero volume
      const filledDays = fillMissingDays(last7Days);
      
      const result = {
        totalVolume,
        volume24h,
        transactions24h,
        topPairs,
        volumeHistory: filledDays
      };
      
      console.log('ANALYTICS: Summary data:', result);
      return result;
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalVolume: 0,
        volume24h: 0,
        transactions24h: 0,
        topPairs: [],
        volumeHistory: []
      };
    }
  };
  
  /**
   * Fill in missing days with zero volume
   * @param {Array} days - Array of daily volumes
   * @returns {Array} Array with all days filled in
   */
  const fillMissingDays = (days) => {
    if (days.length === 0) return [];
    
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Go back 6 days from today (for a total of 7 days including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingDay = days.find(d => d.date === dateStr);
      if (existingDay) {
        result.push(existingDay);
      } else {
        result.push({
          date: dateStr,
          volume: 0
        });
      }
    }
    
    return result;
  };
  
  /**
   * Add test data for development purposes
   */
  export const addTestData = () => {
    // Clear existing data
    clearAnalyticsData();
    
    const tokens = ['SOL', 'USDC', 'USDT', 'ETH', 'BTC', 'BONK'];
    const now = Date.now();
    const transactions = [];
    
    // Generate 50 random transactions over the last 30 days
    for (let i = 0; i < 50; i++) {
      const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
      let toToken = tokens[Math.floor(Math.random() * tokens.length)];
      while (toToken === fromToken) {
        toToken = tokens[Math.floor(Math.random() * tokens.length)];
      }
      
      const fromAmount = Math.random() * 100;
      const toAmount = Math.random() * 1000;
      const usdValue = Math.random() * 5000;
      const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      transactions.push({
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        usdValue,
        txHash: `test-tx-${i}`,
        walletAddress: 'test-wallet',
        timestamp
      });
    }
    
    // Save transactions
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    // Update daily volumes and pairs volume
    transactions.forEach(tx => {
      // Get day for this transaction
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      
      // Update daily volumes
      const dailyVolumes = getDailyVolumes();
      const dayRecord = dailyVolumes.find(d => d.date === date);
      if (dayRecord) {
        dayRecord.volume += tx.usdValue;
      } else {
        dailyVolumes.push({
          date,
          volume: tx.usdValue
        });
      }
      localStorage.setItem(STORAGE_KEYS.DAILY_VOLUMES, JSON.stringify(dailyVolumes));
      
      // Update pairs volume
      const pairsVolume = getPairsVolume();
      const tokens = [tx.fromToken, tx.toToken].sort();
      const pairKey = `${tokens[0]}-${tokens[1]}`;
      const pairRecord = pairsVolume.find(p => p.pair === pairKey);
      if (pairRecord) {
        pairRecord.volume += tx.usdValue;
        pairRecord.count += 1;
      } else {
        pairsVolume.push({
          pair: pairKey,
          tokens,
          volume: tx.usdValue,
          count: 1
        });
      }
      localStorage.setItem(STORAGE_KEYS.PAIRS_VOLUME, JSON.stringify(pairsVolume));
    });
    
    console.log('ANALYTICS: Test data added');
  };
  
  /**
   * Clear all analytics data
   */
  export const clearAnalyticsData = () => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_VOLUMES);
    localStorage.removeItem(STORAGE_KEYS.PAIRS_VOLUME);
    console.log('ANALYTICS: All data cleared');
  };
  