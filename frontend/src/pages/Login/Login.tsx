import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext.hooks';
import { useError } from '@/contexts/ErrorContext.hooks';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const { showError, showSuccess } = useError();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/chat';

  useEffect(() => {
    console.log('[Login] Auth state changed:', { isAuthenticated, isLoading, from });
    if (isAuthenticated && !isLoading) {
      console.log('[Login] Redirecting to:', from);
      showSuccess('Login successful!');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from, showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      showSuccess('Login successful!');
      navigate(from, { replace: true });
    } catch {
      showError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('[Login] Starting Google login...');
      await loginWithGoogle();
      console.log('[Login] Google login completed, checking auth state...');
      
      // Add a small delay to ensure state has updated, then check manually
      setTimeout(() => {
        if (isAuthenticated) {
          console.log('[Login] Manual redirect after Google login success');
          showSuccess('Login successful!');
          navigate(from, { replace: true });
        }
      }, 100);
      
    } catch (error: any) {
      console.error('[Login] Google login error:', error);
      if (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK') {
        showError('Server is currently unavailable. Please try again later.');
      } else {
        showError('Google login failed. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minHeight="100vh"
        py={3}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Sign in to continue to Trip Booking Assistant
          </Typography>

          {location.state?.message && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {location.state.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            Continue with Google
          </Button>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Button
                color="primary"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};