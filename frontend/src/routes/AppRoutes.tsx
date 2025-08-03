import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Landing, Chat, TripDetails, Profile } from '@/pages';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page without header/footer */}
      <Route
        path="/"
        element={<Layout showHeader={false} showFooter={false} />}
      >
        <Route index element={<Landing />} />
      </Route>

      {/* App routes with header/footer */}
      <Route path="/" element={<Layout />}>
        <Route path="chat" element={<Chat />} />
        <Route path="trip/:id" element={<TripDetails />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Placeholder routes for future implementation */}
        <Route path="about" element={<div>About page coming soon...</div>} />
        <Route path="help" element={<div>Help page coming soon...</div>} />
        <Route path="contact" element={<div>Contact page coming soon...</div>} />
        <Route path="privacy" element={<div>Privacy policy coming soon...</div>} />
        <Route path="terms" element={<div>Terms of service coming soon...</div>} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;