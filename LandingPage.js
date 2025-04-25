import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  useTheme,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Paper,
  useMediaQuery,
  IconButton,
  Select,
  MenuItem,
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Slide,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  Tooltip,
  Fab
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import VerifiedIcon from '@mui/icons-material/Verified';
import ThemeToggle from '../components/ThemeToggle';
import { ColorModeContext } from '../context/ThemeContext';
import WalletConnectButton from '../components/WalletConnectButton';
import { useWallet } from '@solana/wallet-adapter-react';
import Header from '../components/Header';
import TopSolanaTokens from '../components/TopSolanaTokens';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { forwardRef } from 'react';

// Use a placeholder URL for the Solana logo
const solanaLogo = 'https://i.imghippo.com/files/gLkP9762ZF.png';

// Otter mascot image - replace with your actual otter mascot image URL
// This is a placeholder cartoon otter image
const otterMascot = 'https://i.imghippo.com/files/gLkP9762ZF.png';

// Add this transition component for the dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function LandingPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { connected, publicKey } = useWallet();
  
  // Add these new state variables
  const [showTaskBox, setShowTaskBox] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const [hasSeenTaskBox, setHasSeenTaskBox] = useState(false);
  
  // Update body data-theme attribute when theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', theme.palette.mode);
  }, [theme.palette.mode]);

  // Check if this is a new user and show the task box
  useEffect(() => {
    const taskBoxSeen = localStorage.getItem('otterfi_seen_task_box');
    setHasSeenTaskBox(!!taskBoxSeen);
    
    if (!taskBoxSeen) {
      // Wait a moment before showing the task box for better UX
      const timer = setTimeout(() => {
        setShowTaskBox(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Handle closing the task box
  const handleCloseTaskBox = () => {
    setShowTaskBox(false);
    localStorage.setItem('otterfi_seen_task_box', 'true');
    setHasSeenTaskBox(true);
  };
  
  // Handle opening the task box
  const handleOpenTaskBox = () => {
    setShowTaskBox(true);
  };
  
  // Generate a referral code based on wallet address or a random string
  useEffect(() => {
    if (connected && publicKey) {
      // Use the last 8 characters of the wallet address as the referral code
      const code = publicKey.toString().slice(-8);
      setReferralCode(code);
    } else {
      // Generate a random code for non-connected users
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      setReferralCode(randomCode);
    }
  }, [connected, publicKey]);
  
  // Copy referral link to clipboard
  const copyReferralLink = () => {
    // Use window.location.origin to get the current domain
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setReferralCopied(false);
    }, 2000);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const floatingAnimation = {
    y: ['-5%', '5%'],
    transition: {
      y: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }
    }
  };

  return (
    <Box sx={{ 
      overflowX: 'hidden',
      position: 'relative',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' 
        : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)'
    }}>
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Use the Header component */}
        <Header />
        
        {/* Hero Section with Otter Mascot */}
        <Grid container spacing={4} sx={{ py: 8, alignItems: 'center' }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  mb: 2,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #9945FF, #14F195)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}
              >
                Trade at the Speed of Solana
              </Typography>
              
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  mb: 4, 
                  color: theme.palette.text.secondary,
                  fontWeight: 400
                }}
              >
               Swap tokens instantly on Solana with low fees and top prices—powered by Jupiter's deep liquidity and smart routing. Enjoy real-time analytics and seamless wallet integration for a fast, precise trading experience.
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {!connected ? (
                  <WalletConnectButton 
                    variant="contained" 
                    size="large"
                    sx={{
                      px: 4, 
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  />
                ) : (
                  <Button
                    component={Link}
                    to="/swap"
                    variant="contained"
                    size="large"
                    startIcon={<SwapHorizIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Start Trading
                  </Button>
                )}
              </Stack>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Otter Mascot - This is the main feature */}
            <motion.div
              animate={floatingAnimation}
              style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* Large Otter Mascot Image */}
              <Box 
                component="img"
                src={otterMascot}
                alt="Otter Mascot"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  zIndex: 2,
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
                }}
                onError={(e) => {
                  e.target.src = 'https://url-shortener.me/XK6';
                }}
              />

              {/* Floating elements around the otter */}
              <Box 
                component={motion.div}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                sx={{
                  position: 'absolute',
                  top: '10%',
                  left: isMobile ? '5%' : '-5%',
                  background: theme.palette.mode === 'dark' ? 'rgba(20, 241, 149, 0.1)' : 'rgba(20, 241, 149, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  p: 1.5,
                  border: '1px solid rgba(20, 241, 149, 0.3)',
                  maxWidth: 180,
                  zIndex: 3
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" color="#14F195">Transaction Confirmed</Typography>
                <Typography variant="caption" color="text.secondary">0.5 SOL → 11.27 USDC</Typography>
              </Box>
              
              <Box 
                component={motion.div}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  right: isMobile ? '5%' : '-5%',
                  background: theme.palette.mode === 'dark' ? 'rgba(153, 69, 255, 0.1)' : 'rgba(153, 69, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  p: 1.5,
                  border: '1px solid rgba(153, 69, 255, 0.3)',
                  maxWidth: 180,
                  zIndex: 3
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" color="#9945FF">Price Alert</Typography>
                <Typography variant="caption" color="text.secondary">SOL up 5.2% in the last hour</Typography>
              </Box>
              
              {/* Circular glow behind the otter */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(153, 69, 255, 0.2) 0%, rgba(20, 241, 149, 0.2) 50%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(40px)',
                  zIndex: 1
                }}
              />
            </motion.div>
          </Grid>
        </Grid>

        {/* Top Solana Tokens Section */}
        <TopSolanaTokens />

        {/* Features Section */}
        <Box 
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          sx={{ py: 8 }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            sx={{ 
              mb: 2,
              fontWeight: 'bold',
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #ffffff, #cccccc)' 
                : 'linear-gradient(45deg, #333333, #666666)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Why Choose Otterfi
          </Typography>
          
          <Typography 
            variant="h6" 
            component="p" 
            align="center" 
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}
          >
            Our platform combines cutting-edge technology with user-friendly design to deliver the best trading experience.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <motion.div
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     alignItems: 'center',
                                     textAlign: 'center',
                                     borderRadius: 4
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       mb: 3, 
                                       p: 2, 
                                       borderRadius: '50%', 
                                       background: 'linear-gradient(135deg, rgba(20, 241, 149, 0.2), rgba(20, 241, 149, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center'
                                     }}
                                   >
                                     <SpeedIcon sx={{ fontSize: 40, color: '#14F195' }} />
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Lightning Fast</Typography>
                                   <Typography variant="body1" color="text.secondary">
                                     Execute trades in milliseconds with Solana's high-performance blockchain. Our optimized smart contracts ensure minimal latency and maximum throughput.
                                   </Typography>
                                 </Paper>
                               </motion.div>
                             </Grid>
                             
                             <Grid item xs={12} md={4}>
                               <motion.div
                                 whileHover={{ y: -10, transition: { duration: 0.3 } }}
                               >
                                 <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     alignItems: 'center',
                                     textAlign: 'center',
                                     borderRadius: 4
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       mb: 3, 
                                       p: 2, 
                                       borderRadius: '50%', 
                                       background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(153, 69, 255, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center'
                                     }}
                                   >
                                     <SecurityIcon sx={{ fontSize: 40, color: '#9945FF' }} />
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Secure & Reliable</Typography>
                                   <Typography variant="body1" color="text.secondary">
                                     Trade with confidence knowing your assets are protected by industry-leading security measures. Our platform undergoes regular audits and implements best practices.
                                   </Typography>
                                 </Paper>
                               </motion.div>
                             </Grid>
                             
                             <Grid item xs={12} md={4}>
                               <motion.div
                                 whileHover={{ y: -10, transition: { duration: 0.3 } }}
                               >
                                 <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     alignItems: 'center',
                                     textAlign: 'center',
                                     borderRadius: 4
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       mb: 3, 
                                       p: 2, 
                                       borderRadius: '50%', 
                                       background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 184, 0, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center'
                                     }}
                                   >
                                     <CurrencyExchangeIcon sx={{ fontSize: 40, color: '#FFB800' }} />
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Best Prices</Typography>
                                   <Typography variant="body1" color="text.secondary">
                                     Get the most competitive rates through our integration with Jupiter's smart routing algorithm, which finds the best prices across all Solana DEXs.
                                   </Typography>
                                 </Paper>
                               </motion.div>
                             </Grid>
                           </Grid>
                         </Box>
                         
                         {/* How It Works Section */}
                         <Box 
                           component={motion.div}
                           initial="hidden"
                           whileInView="visible"
                           viewport={{ once: true }}
                           variants={fadeIn}
                           sx={{ py: 8 }}
                         >
                           <Typography 
                             variant="h3" 
                             component="h2" 
                             align="center" 
                             sx={{ 
                               mb: 2,
                               fontWeight: 'bold',
                               background: theme.palette.mode === 'dark' 
                                 ? 'linear-gradient(45deg, #ffffff, #cccccc)' 
                                 : 'linear-gradient(45deg, #333333, #666666)',
                               WebkitBackgroundClip: 'text',
                               WebkitTextFillColor: 'transparent',
                             }}
                           >
                             How It Works
                           </Typography>
                           
                           <Typography 
                             variant="h6" 
                             component="p" 
                             align="center" 
                             color="text.secondary"
                             sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}
                           >
                             Trading on Otterfi is simple, fast, and secure. Follow these steps to get started.
                           </Typography>
                           
                           <Grid container spacing={4}>
                             <Grid item xs={12} md={4}>
                               <motion.div
                                 whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                               >
                                 <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     borderRadius: 4,
                                     position: 'relative',
                                     overflow: 'hidden'
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       position: 'absolute',
                                       top: 16,
                                       right: 16,
                                       width: 40,
                                       height: 40,
                                       borderRadius: '50%',
                                       background: 'linear-gradient(135deg, rgba(20, 241, 149, 0.2), rgba(20, 241, 149, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center',
                                       fontSize: '1.5rem',
                                       fontWeight: 'bold',
                                       color: '#14F195'
                                     }}
                                   >
                                     1
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Connect Wallet</Typography>
                                   <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                     Connect your Solana wallet with a single click. We support Phantom, Solflare, and other popular wallets.
                                   </Typography>
                                   <Box 
                                     sx={{ 
                                       mt: 'auto', 
                                       pt: 2, 
                                       borderTop: '1px solid',
                                       borderColor: 'divider'
                                     }}
                                   >
                                     <Typography variant="body2" color="primary">
                                       Secure and non-custodial
                                     </Typography>
                                   </Box>
                                 </Paper>
                               </motion.div>
                             </Grid>
                             
                             <Grid item xs={12} md={4}>
                               <motion.div
                                 whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                               >
                                 <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     borderRadius: 4,
                                     position: 'relative',
                                     overflow: 'hidden'
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       position: 'absolute',
                                       top: 16,
                                       right: 16,
                                       width: 40,
                                       height: 40,
                                       borderRadius: '50%',
                                       background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(153, 69, 255, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center',
                                       fontSize: '1.5rem',
                                       fontWeight: 'bold',
                                       color: '#9945FF'
                                     }}
                                   >
                                     2
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Select Tokens</Typography>
                                   <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                     Choose the tokens you want to swap from our extensive list of Solana tokens. Enter the amount and review the quote.
                                   </Typography>
                                   <Box 
                                     sx={{ 
                                       mt: 'auto', 
                                       pt: 2, 
                                       borderTop: '1px solid',
                                       borderColor: 'divider'
                                     }}
                                   >
                                     <Typography variant="body2" color="primary">
                                       Real-time price data
                                     </Typography>
                                   </Box>
                                 </Paper>
                               </motion.div>
                             </Grid>
                             
                             <Grid item xs={12} md={4}>
                               <motion.div
                                 whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                               >
                                 <Paper 
                                   elevation={0}
                                   className="glass"
                                   sx={{ 
                                     p: 4, 
                                     height: '100%',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     borderRadius: 4,
                                     position: 'relative',
                                     overflow: 'hidden'
                                   }}
                                 >
                                   <Box 
                                     sx={{ 
                                       position: 'absolute',
                                       top: 16,
                                       right: 16,
                                       width: 40,
                                       height: 40,
                                       borderRadius: '50%',
                                       background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 184, 0, 0.1))',
                                       display: 'flex',
                                       justifyContent: 'center',
                                       alignItems: 'center',
                                       fontSize: '1.5rem',
                                       fontWeight: 'bold',
                                       color: '#FFB800'
                                     }}
                                   >
                                     3
                                   </Box>
                                   <Typography variant="h5" fontWeight="bold" gutterBottom>Confirm & Swap</Typography>
                                   <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                     Review the transaction details and confirm the swap. Your tokens will be exchanged instantly at the best available rate.
                                   </Typography>
                                   <Box 
                                     sx={{ 
                                       mt: 'auto', 
                                       pt: 2, 
                                       borderTop: '1px solid',
                                       borderColor: 'divider'
                                     }}
                                   >
                                     <Typography variant="body2" color="primary">
                                       Lightning-fast execution
                                     </Typography>
                                   </Box>
                                 </Paper>
                               </motion.div>
                             </Grid>
                           </Grid>
                         </Box>
                         
                         {/* CTA Section */}
                         <Box 
                           component={motion.div}
                           initial="hidden"
                           whileInView="visible"
                           viewport={{ once: true }}
                           variants={fadeIn}
                           sx={{ 
                             py: 8, 
                             textAlign: 'center',
                             position: 'relative'
                           }}
                         >
                           <Paper 
                             elevation={0}
                             className="glass"
                             sx={{ 
                               p: { xs: 4, md: 8 }, 
                               borderRadius: 4,
                               position: 'relative',
                               overflow: 'hidden',
                               background: theme.palette.mode === 'dark' 
                                 ? 'linear-gradient(135deg, rgba(153, 69, 255, 0.1), rgba(20, 241, 149, 0.1))' 
                                 : 'linear-gradient(135deg, rgba(153, 69, 255, 0.1), rgba(20, 241, 149, 0.1))'
                             }}
                           >
                             {/* Background decorative elements */}
                             <Box 
                               sx={{ 
                                 position: 'absolute',
                                 top: -100,
                                 right: -100,
                                 width: 300,
                                 height: 300,
                                 borderRadius: '50%',
                                 background: 'radial-gradient(circle, rgba(153, 69, 255, 0.2) 0%, rgba(153, 69, 255, 0) 70%)',
                                 zIndex: 0
                               }}
                             />
                             <Box 
                               sx={{ 
                                 position: 'absolute',
                                 bottom: -100,
                                 left: -100,
                                 width: 300,
                                 height: 300,
                                 borderRadius: '50%',
                                 background: 'radial-gradient(circle, rgba(20, 241, 149, 0.2) 0%, rgba(20, 241, 149, 0) 70%)',
                                 zIndex: 0
                               }}
                             />
                             
                             <Box sx={{ position: 'relative', zIndex: 1 }}>
                               <Typography 
                                 variant="h3" 
                                 component="h2" 
                                 sx={{ 
                                   mb: 3,
                                   fontWeight: 'bold',
                                   background: 'linear-gradient(45deg, #9945FF, #14F195)',
                                   WebkitBackgroundClip: 'text',
                                   WebkitTextFillColor: 'transparent',
                                 }}
                               >
                                 Ready to Start Trading?
                               </Typography>
                               
                               <Typography 
                                 variant="h6" 
                                 component="p" 
                                 color="text.secondary"
                                 sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}
                               >
                                 Join thousands of traders who trust Otterfi for their Solana trading needs. Experience the fastest, most secure DEX on Solana today.
                               </Typography>
                               
                               <Button
                                 component={Link}
                                 to="/swap"
                                 variant="contained"
                                 size="large"
                                 startIcon={<SwapHorizIcon />}
                                 sx={{
                                   px: 4,
                                   py: 1.5,
                                   fontSize: '1.1rem',
                                   borderRadius: '12px',
                                   background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
                                   textTransform: 'none',
                                   fontWeight: 600
                                 }}
                               >
                                 Launch App
                               </Button>
                             </Box>
                           </Paper>
                         </Box>
                         
                        {/* Footer */}
                        <Box 
  component="footer" 
  sx={{ 
    mt: 'auto', 
    pt: 4,
    pb: 2,
    borderTop: '1px solid',
    borderColor: 'divider'
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <img 
      src={solanaLogo} 
      alt="Otterfi Logo" 
      style={{ height: 24, width: 'auto' }} 
      onError={(e) => {
        e.target.src = 'https://url-shortener.me/XK6';
      }}
    />
    <Typography 
      variant="h6" 
      component="span" 
      sx={{ 
        fontWeight: 'bold',
        background: 'linear-gradient(45deg, #9945FF, #14F195)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Otterfi
    </Typography>
  </Box>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
    The fastest and most secure decentralized exchange on Solana. Trade tokens with confidence.
  </Typography>
  {/* Social Media Links */}
  <Stack direction="row" spacing={1}>
    <IconButton 
      color="primary" 
      aria-label="Twitter"
      component="a"
      href="https://x.com/Otterfiexchange?s=21" 
      target="_blank"
      rel="noopener noreferrer"
    >
      <TwitterIcon />
    </IconButton>
    <IconButton 
      color="primary" 
      aria-label="Telegram"
      component="a"
      href="https://t.me/Otterfi" 
      target="_blank"
      rel="noopener noreferrer"
    >
      <TelegramIcon />
    </IconButton>
    <IconButton 
      color="primary" 
      aria-label="Instagram"
      component="a"
      href="https://www.instagram.com/Otterfiexchange?igsh=anZpNnJ2cTZtbjZx&utm_source=qr" 
      target="_blank"
      rel="noopener noreferrer"
    >
      <InstagramIcon />
    </IconButton>
  </Stack>

  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
    © {new Date().getFullYear()} Otterfi. All rights reserved.
  </Typography>
</Box>
      </Container>

      {/* Floating Earn Button - Always visible after user closes the task box */}
      {hasSeenTaskBox && !showTaskBox && (
        <Fab
          color="primary"
          aria-label="earn"
          onClick={handleOpenTaskBox}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #8035EE 0%, #10E085 100%)',
            },
            zIndex: 1000
          }}
        >
          <MonetizationOnIcon />
        </Fab>
      )}

      {/* Task Box Dialog */}
      <Dialog
        open={showTaskBox}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseTaskBox}
        aria-describedby="task-box-description"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e, #16213e)' 
              : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          position: 'relative', 
          p: 3,
          background: 'linear-gradient(45deg, rgba(153, 69, 255, 0.1), rgba(20, 241, 149, 0.1))',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <IconButton
            aria-label="close"
            onClick={handleCloseTaskBox}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 36, color: '#FFD700' }} />
            <Box>
              <Typography variant="h5" component="h2" fontWeight="bold">
                Otterfi Rewards Program
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete tasks and earn rewards!
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Chip 
              label="Limited Time Offer" 
              color="error" 
              size="small" 
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🏆 Trading Competition
            </Typography>
            <Typography variant="body1" paragraph>
              The first 100 users to complete 100 swaps will receive:
            </Typography>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 241, 149, 0.1)' : 'rgba(20, 241, 149, 0.1)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(20, 241, 149, 0.3)' : 'rgba(20, 241, 149, 0.3)',
              mb: 2
            }}>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TaskAltIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="$20 worth of USDT" 
                    secondary="Sent directly to your wallet"
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TaskAltIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="$OTFI Token Airdrop" 
                    secondary="Our official governance token"
                  />
                </ListItem>
              </List>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Winners will be announced weekly on our Telegram and Twitter channels. All trades must be completed within the trading week (Monday-Sunday).
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              👥 Referral Program
            </Typography>
            <Typography variant="body1" paragraph>
              Invite your friends and earn rewards for each successful referral:
            </Typography>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(153, 69, 255, 0.1)' : 'rgba(153, 69, 255, 0.1)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(153, 69, 255, 0.3)' : 'rgba(153, 69, 255, 0.3)',
              mb: 2
            }}>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="$2 USDT per friend" 
                    secondary="When they trade at least $10 worth of tokens"
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Unlimited referrals" 
                    secondary="The more friends you invite, the more you earn"
                  />
                </ListItem>
              </List>
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Your referral code:
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={referralCode}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={referralCopied ? "Copied!" : "Copy to clipboard"}>
                      <IconButton
                        edge="end"
                        onClick={copyReferralLink}
                        color={referralCopied ? "success" : "default"}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Share this code with your friends to start earning rewards. Rewards will be distributed weekly.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseTaskBox} 
            color="inherit"
            sx={{ mr: 1 }}
          >
            Remind Me Later
          </Button>
          <Button
            variant="contained"
            component={Link}
            to="/swap"
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #9945FF 0%, #14F195 100%)',
            }}
          >
            Start Trading Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LandingPage;










