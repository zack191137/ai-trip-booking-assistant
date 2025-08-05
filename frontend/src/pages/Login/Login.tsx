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

// Error type for network errors
interface NetworkError extends Error {
  code?: string;
}

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
    if (isAuthenticated && !isLoading) {
      showSuccess('Login successful!');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from, showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showError('Please enter both email and password');
      return;
    }
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login({ email: email.trim(), password });
      // Navigation will be handled by useEffect when isAuthenticated becomes true
    } catch (error) {
      if ((error as NetworkError)?.message?.includes('Network Error') || (error as NetworkError)?.code === 'ERR_NETWORK') {
        showError('Server is currently unavailable. Please try again later.');
      } else if ((error as NetworkError)?.message?.includes('401') || (error as NetworkError)?.message?.includes('Invalid')) {
        showError('Invalid email or password. Please check your credentials.');
      } else {
        showError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      
      // Add a small delay to ensure state has updated, then check manually
      setTimeout(() => {
        if (isAuthenticated) {
          showSuccess('Login successful!');
          navigate(from, { replace: true });
        }
      }, 100);
      
    } catch (error) {
      if ((error as NetworkError)?.message?.includes('Network Error') || (error as NetworkError)?.code === 'ERR_NETWORK') {
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
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              error={!email.trim() && isSubmitting}
              helperText={!email.trim() && isSubmitting ? 'Email is required' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              }}
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
              error={!password.trim() && isSubmitting}
              helperText={!password.trim() && isSubmitting ? 'Password is required' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || (!email.trim() || !password.trim())}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Signing In...
                </Box>
              ) : (
                'Sign In with Email'
              )}
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