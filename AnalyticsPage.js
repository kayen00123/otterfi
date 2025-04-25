import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, Card, CardContent, Button
} from '@mui/material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import Header from '../components/Header';
import { getAnalyticsSummary } from '../services/analyticsService';
import RefreshIcon from '@mui/icons-material/Refresh';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const AnalyticsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalVolume: 0,
    volume24h: 0,
    transactions24h: 0,
    topPairs: [],
    volumeHistory: []
  });
  
  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    
    // For large numbers, use K, M, B suffixes
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
    
  // Format number
  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };
    
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = () => {
      setLoading(true);
      
      try {
        const data = getAnalyticsSummary();
        console.log('ANALYTICS PAGE: Fetched data:', data);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
    
    // Refresh data every minute
    const interval = setInterval(fetchAnalytics, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
    
  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    try {
      const data = getAnalyticsSummary();
      setAnalytics(data);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setLoading(false);
    }
  };
    
  // Prepare chart data for volume history
  const volumeChartData = {
    labels: analytics.volumeHistory.map(item => {
      // Format date as MM/DD
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Trading Volume (USD)',
        data: analytics.volumeHistory.map(item => item.volume),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4
      }
    ]
  };
    
  // Prepare chart data for top pairs
  const pairsChartData = {
    labels: analytics.topPairs.map(pair => pair.pair),
    datasets: [
      {
        label: 'Volume (USD)',
        data: analytics.topPairs.map(pair => pair.volume),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };
    
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => formatCurrency(value)
        }
      }
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
              Personal Analytics
            </Typography>
            
            <Button 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              variant="contained"
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Key Metrics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 4,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total Volume
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold">
                        {formatCurrency(analytics.totalVolume)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 4,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        24h Volume
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold">
                        {formatCurrency(analytics.volume24h)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 4,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        24h Transactions
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold">
                        {formatNumber(analytics.transactions24h)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Volume Chart */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 4,
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Trading Volume History (Last 7 Days)
                </Typography>
                {analytics.volumeHistory.length > 0 ? (
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Line data={volumeChartData} options={chartOptions} />
                  </Box>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No volume data available yet. Start trading to see your volume history.
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              {/* Top Pairs */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      borderRadius: 4,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Top Trading Pairs
                    </Typography>
                    {analytics.topPairs.length > 0 ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Pair</TableCell>
                              <TableCell align="right">Volume</TableCell>
                              <TableCell align="right">Transactions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {analytics.topPairs.map((pair, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {pair.pair}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(pair.volume)}
                                </TableCell>
                                <TableCell align="right">
                                  {formatNumber(pair.count)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          No trading pairs data available yet. Start trading to see your most active pairs.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      borderRadius: 4,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Volume Distribution by Pair
                    </Typography>
                    {analytics.topPairs.length > 0 ? (
                      <Box sx={{ height: 300, mt: 2 }}>
                        <Doughnut 
                          data={pairsChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  color: theme.palette.text.primary
                                }
                              }
                            }
                          }} 
                        />
                      </Box>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          No volume distribution data available yet. Start trading to see your volume distribution.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Empty State - simplified */}
              {analytics.totalVolume === 0 && analytics.topPairs.length === 0 && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    mt: 4,
                    borderRadius: 4,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    textAlign: 'center'
                  }}
                >
                                   <Typography variant="h6" gutterBottom>
                    No Analytics Data Yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Start trading on Otterfi to see your analytics data here. Every swap you make will be tracked and displayed in this dashboard.
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default AnalyticsPage;


  
