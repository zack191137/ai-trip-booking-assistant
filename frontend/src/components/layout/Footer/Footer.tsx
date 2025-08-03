import { Box, Container, Typography, Link, Stack, Divider } from '@mui/material';
import { FlightTakeoff, GitHub, Email } from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'center', md: 'flex-start' }}
          spacing={4}
        >
          {/* Brand */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FlightTakeoff sx={{ mr: 1, color: 'primary.main' }} />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #90caf9, #f48fb1)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Trip Assistant
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              AI-powered trip planning assistant to help you discover and book your perfect vacation.
            </Typography>
          </Box>

          {/* Links */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.primary" gutterBottom>
                Product
              </Typography>
              <Stack spacing={1}>
                <Link href="/chat" color="text.secondary" underline="hover">
                  Plan Trip
                </Link>
                <Link href="/about" color="text.secondary" underline="hover">
                  How it Works
                </Link>
                <Link href="/pricing" color="text.secondary" underline="hover">
                  Pricing
                </Link>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.primary" gutterBottom>
                Support
              </Typography>
              <Stack spacing={1}>
                <Link href="/help" color="text.secondary" underline="hover">
                  Help Center
                </Link>
                <Link href="/contact" color="text.secondary" underline="hover">
                  Contact Us
                </Link>
                <Link href="/status" color="text.secondary" underline="hover">
                  System Status
                </Link>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.primary" gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Link href="/privacy" color="text.secondary" underline="hover">
                  Privacy Policy
                </Link>
                <Link href="/terms" color="text.secondary" underline="hover">
                  Terms of Service
                </Link>
                <Link href="/cookies" color="text.secondary" underline="hover">
                  Cookie Policy
                </Link>
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Trip Booking Assistant. All rights reserved.
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Link
              href="https://github.com/zack191137/ai-trip-booking-assistant"
              color="text.secondary"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <GitHub sx={{ fontSize: 20 }} />
            </Link>
            <Link
              href="mailto:support@tripbookingassistant.com"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Email sx={{ fontSize: 20 }} />
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;