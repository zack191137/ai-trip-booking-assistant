import { Box, Container, Typography, Paper } from '@mui/material';

const TripDetails = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trip Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your trip itinerary.
        </Typography>
      </Box>
      
      <Paper
        sx={{
          p: 4,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          🚧 Trip details coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default TripDetails;