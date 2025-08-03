import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

interface LayoutProps {
  showHeader?: boolean;
  showFooter?: boolean;
}

const Layout = ({ showHeader = true, showFooter = true }: LayoutProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {showHeader && <Header />}
      
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
      
      {showFooter && <Footer />}
    </Box>
  );
};

export default Layout;