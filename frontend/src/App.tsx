import { AppProvider } from '@/contexts';
import AppRoutes from '@/routes/AppRoutes';
import '@/styles/globals.css';

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;