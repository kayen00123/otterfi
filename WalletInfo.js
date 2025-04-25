import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Box, Typography, Paper, Chip, Skeleton, useTheme } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const WalletInfo = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(null);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const getBalance = async () => {
      if (connected && publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    getBalance();
    // Set up an interval to refresh the balance every 30 seconds
    const intervalId = setInterval(getBalance, 30000);

    return () => clearInterval(intervalId);
  }, [connected, publicKey, connection]);

  const formatWalletAddress = (address) => {
    if (!address) return '';
    const addressStr = address.toString();
    return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <Paper 
      elevation={0}
      className="glass"
      sx={{ 
        p: 2, 
        borderRadius: 3,
        mb: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <AccountBalanceWalletIcon 
          sx={{ 
            mr: 1, 
            color: theme.palette.mode === 'dark' ? '#9945FF' : '#14F195' 
          }} 
        />
        <Typography variant="subtitle1" fontWeight="bold">Wallet Info</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Address:
        </Typography>
        <Chip 
          label={formatWalletAddress(publicKey)} 
          size="small"
          onClick={copyAddress}
          onDelete={copyAddress}
          deleteIcon={<ContentCopyIcon fontSize="small" />}
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(153, 69, 255, 0.1)' : 'rgba(20, 241, 149, 0.1)',
            '& .MuiChip-label': {
              color: theme.palette.text.primary
            },
            '& .MuiChip-deleteIcon': {
              color: theme.palette.mode === 'dark' ? '#9945FF' : '#14F195'
            }
          }}
        />
        {copied && (
          <Typography variant="caption" sx={{ ml: 1, color: theme.palette.success.main }}>
            Copied!
          </Typography>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Balance:
        </Typography>
        {balance !== null ? (
          <Typography variant="body2" fontWeight="medium">
            {balance.toFixed(4)} SOL
          </Typography>
        ) : (
          <Skeleton width={80} height={24} />
        )}
      </Box>
    </Paper>
  );
};

export default WalletInfo;
