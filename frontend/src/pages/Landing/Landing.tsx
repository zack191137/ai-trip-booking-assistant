import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/chat');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              mb: 3,
              background: 'linear-gradient(45deg, #90caf9, #f48fb1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 700,
            }}
          >
            🛫 Trip Booking Assistant
          </Typography>
          
          <Typography
            variant="h4"
            component="h2"
            sx={{ mb: 4, color: 'text.secondary', fontWeight: 400 }}
          >
            Plan your perfect trip with AI-powered assistance
          </Typography>
          
          <Typography
            variant="body1"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto', fontSize: '1.125rem' }}
          >
            Get personalized travel recommendations, detailed itineraries, and seamless booking 
            assistance all in one conversation. Let our AI help you discover your next adventure.
          </Typography>
          
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.125rem',
                borderRadius: 2,
                background: 'linear-gradient(45deg, #90caf9, #64b5f6)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                },
              }}
            >
              Start Planning
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/about')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.125rem',
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.light',
                  backgroundColor: 'rgba(144, 202, 249, 0.08)',
                },
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;