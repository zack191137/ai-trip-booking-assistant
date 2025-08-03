import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that handles authentication checks
 * and redirects unauthenticated users to the login page.
 */
const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirecting after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // If user is authenticated but shouldn't access this route (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from public-only pages
    const from = location.state?.from?.pathname || '/chat';
    return <Navigate to={from} replace />;
  }

  // User is authenticated and authorized to view this route
  return <>{children}</>;
};

export default ProtectedRoute;