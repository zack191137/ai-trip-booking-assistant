import { Box, Container, Typography, Paper } from '@mui/material';

const Chat = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Plan Your Trip
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tell me about your dream destination and I'll help you create the perfect itinerary.
        </Typography>
      </Box>
      
      <Paper
        sx={{
          height: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          🚧 Chat interface coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default Chat;