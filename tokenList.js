import { useState, useEffect } from 'react';

const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/strict';

const FALLBACK_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIyQzE3LjUyMjggMjIgMjIgMTcuNTIyOCAyMiAxMkMyMiA2LjQ3NzE1IDE3LjUyMjggMiAxMiAyQzYuNDc3MTUgMiAyIDYuNDc3MTUgMiAxMkMyIDE3LjUyMjggNi40NzcxNSAyMiAxMiAyMloiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEyIDE2VjEyTTEyIDhIMTIuMDEiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==";

export const useTokenList = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add this line to create a popularTokens state
  const [popularTokens, setPopularTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(JUPITER_TOKEN_LIST_URL);
        const data = await response.json();
        
        const formattedTokens = data.map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          image: token.logoURI || FALLBACK_ICON,
          balance: 0 // Default balance, will be updated when wallet connects
        }));

        // Just pick the top 10 most common tokens
        const popular = formattedTokens.filter(token => 
          ['SOL', 'USDC', 'USDT', 'BTC', 'ETH', 'BONK', 'JUP', 'RAY', 'ORCA', 'MNGO']
          .includes(token.symbol)
        ).slice(0, 10);

        setTokens(formattedTokens);
        setPopularTokens(popular);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching token list:', error);
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, popularTokens, loading };
};
