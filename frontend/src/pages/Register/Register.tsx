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

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const { showError, showSuccess } = useError();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/chat';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      showSuccess('Registration successful!');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from, showSuccess]);

  const validateForm = () => {
    if (!name.trim()) {
      showError('Please enter your full name');
      return false;
    }
    if (name.trim().length < 2) {
      showError('Name must be at least 2 characters long');
      return false;
    }
    if (!email.trim()) {
      showError('Please enter your email address');
      return false;
    }
    if (!password.trim()) {
      showError('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
      return false;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register({ 
        email: email.trim(), 
        password, 
        name: name.trim() 
      });
      // Navigation will be handled by useEffect when isAuthenticated becomes true
    } catch (error) {
      if ((error as NetworkError)?.message?.includes('Network Error') || (error as NetworkError)?.code === 'ERR_NETWORK') {
        showError('Server is currently unavailable. Please try again later.');
      } else if ((error as NetworkError)?.message?.includes('409') || (error as NetworkError)?.message?.includes('already exists')) {
        showError('An account with this email already exists. Please try logging in instead.');
      } else if ((error as NetworkError)?.message?.includes('validation')) {
        showError('Please check your input and try again.');
      } else {
        showError('Registration failed. Please try again.');
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
          showSuccess('Registration successful!');
          navigate(from, { replace: true });
        }
      }, 100);
      
    } catch (error) {
      if ((error as NetworkError)?.message?.includes('Network Error') || (error as NetworkError)?.code === 'ERR_NETWORK') {
        showError('Server is currently unavailable. Please try again later.');
      } else {
        showError('Google registration failed. Please try again.');
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
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Join Trip Booking Assistant to start planning your adventures
          </Typography>

          {location.state?.message && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {location.state.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              autoComplete="name"
              autoFocus
              error={!name.trim() && isSubmitting}
              helperText={!name.trim() && isSubmitting ? 'Full name is required' : ''}
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
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
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
              autoComplete="new-password"
              error={(!password.trim() || password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) && isSubmitting}
              helperText={
                !password.trim() && isSubmitting 
                  ? 'Password is required' 
                  : password.length > 0 && password.length < 8 && isSubmitting
                  ? 'Password must be at least 8 characters'
                  : password.length >= 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) && isSubmitting
                  ? 'Password must contain lowercase, uppercase, and number'
                  : !isSubmitting && password.length === 0
                  ? 'Minimum 8 characters with lowercase, uppercase, and number'
                  : ''
              }
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
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              error={password !== confirmPassword && isSubmitting && confirmPassword.length > 0}
              helperText={
                password !== confirmPassword && isSubmitting && confirmPassword.length > 0
                  ? 'Passwords do not match'
                  : ''
              }
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
              disabled={isSubmitting || (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim())}
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
                  Creating Account...
                </Box>
              ) : (
                'Create Account'
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
              Already have an account?{' '}
              <Button
                color="primary"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Sign in
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};