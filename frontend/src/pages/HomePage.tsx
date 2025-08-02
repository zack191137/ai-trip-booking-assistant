import React from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Avatar,
} from '@mui/material'
import { Grid } from '@mui/material'
import {
  Flight,
  Restaurant,
  Chat,
  AutoAwesome,
  Schedule,
  Security,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const FEATURES = [
  {
    icon: <AutoAwesome />,
    title: 'AI-Powered Planning',
    description: 'Get personalized trip recommendations based on your preferences, budget, and travel style.',
  },
  {
    icon: <Chat />,
    title: 'Interactive Chat',
    description: 'Chat with our AI assistant to plan your trip step by step with natural conversation.',
  },
  {
    icon: <Flight />,
    title: 'Comprehensive Booking',
    description: 'Book flights, hotels, and activities all in one place with competitive prices.',
  },
  {
    icon: <Schedule />,
    title: 'Smart Itineraries',
    description: 'Get detailed day-by-day itineraries optimized for your time and interests.',
  },
  {
    icon: <Security />,
    title: 'Secure & Reliable',
    description: 'Your data is protected with enterprise-grade security and privacy measures.',
  },
  {
    icon: <Restaurant />,
    title: 'Local Experiences',
    description: 'Discover authentic local restaurants, attractions, and hidden gems.',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/chat')
    } else {
      navigate('/auth')
    }
  }

  const handleViewTrips = () => {
    navigate('/trips')
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                Plan Your Perfect Trip with AI
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  fontWeight: 300,
                }}
              >
                From inspiration to booking, let our AI assistant create personalized travel experiences just for you.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                    },
                  }}
                >
                  {isAuthenticated ? 'Start Planning' : 'Get Started'}
                </Button>
                {isAuthenticated && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleViewTrips}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    My Trips
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 400,
                    height: 300,
                    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <Flight sx={{ fontSize: 80, opacity: 0.8 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Why Choose Our AI Travel Assistant?
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Experience the future of travel planning with intelligent recommendations and seamless booking
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {FEATURES.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Planning your dream trip is just three simple steps away
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                  }}
                >
                  1
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Chat with AI
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tell our AI assistant about your dream destination, dates, budget, and preferences through natural conversation.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'secondary.main',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                  }}
                >
                  2
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Get Personalized Plans
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Receive custom itineraries with flights, hotels, activities, and restaurants tailored to your style and budget.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'success.main',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                  }}
                >
                  3
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Book & Go
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Book everything directly through our platform and get ready for your amazing trip with detailed itineraries.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of travelers who have discovered their perfect trips with our AI assistant
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            {isAuthenticated ? 'Plan Your Next Trip' : 'Sign Up Free'}
          </Button>
        </Container>
      </Box>
    </Box>
  )
}