import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BarChartIcon from '@mui/icons-material/BarChart';
import ThemeToggle from './ThemeToggle';
import WalletConnectButton from './WalletConnectButton';

const Header = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  
  // Logo URL
  const solanaLogo = 'https://url-shortener.me/XK6';
  
  const navItems = [
    { name: 'Swap', path: '/swap', icon: <SwapHorizIcon /> },
    { name: 'Cross-Chain/EVM Swap', path: '/cross-chain', icon: <CompareArrowsIcon /> },
    { name: 'Trenches', path: '/trenches', icon: <TrendingUpIcon /> },
    { name: 'Portfolio', path: '/portfolio', icon: <AccountBalanceWalletIcon /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChartIcon /> }
  ];
  
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Get current active path
  const getCurrentPath = () => {
    const path = location.pathname;
    return navItems.findIndex(item => path === item.path || path.startsWith(item.path));
  };
  
  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          py: 2,
          px: { xs: 2, sm: 3, md: 0 },
          mb: isMobile ? 7 : 0 // Add bottom margin on mobile to make space for bottom navigation
        }}
      >
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
    <img 
      src="https://i.imghippo.com/files/gLkP9762ZF.png" 
      alt="Otterfi Logo" 
      style={{ height: 30, width: 'auto' }} 
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
  </Link>
</Box>

        
        {isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ThemeToggle />
            <WalletConnectButton size="small" />
            {!isSmallMobile && (
              <IconButton 
                edge="end" 
                color="inherit" 
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {navItems.map((item) => (
                <Button 
                  key={item.name} 
                  component={Link} 
                  to={item.path} 
                  color="inherit"
                  sx={{ 
                    fontWeight: 'medium',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
            
            <ThemeToggle />
            <WalletConnectButton />
          </Box>
        )}
        
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              width: 250,
              backgroundColor: theme.palette.background.default,
              backgroundImage: 'none'
            }
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.name} 
                component={Link} 
                to={item.path}
                onClick={toggleDrawer(false)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.name} 
                  primaryTypographyProps={{ 
                    variant: 'body1',
                    fontWeight: 'medium'
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Drawer>
      </Box>
      
      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={getCurrentPath()}
            showLabels
            sx={{
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction 
                key={item.name}
                component={Link}
                to={item.path}
                label={item.name}
                icon={item.icon}
                sx={{
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    transition: 'font-size 0.2s, opacity 0.2s',
                    opacity: 0.7,
                    '&.Mui-selected': {
                      fontSize: '0.75rem',
                      opacity: 1
                    }
                  }
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
};

export default Header;
