import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [backendUrl] = useState<string>('https://ai.zackz.net:3000');

  useEffect(() => {
    // Test connection to backend
    fetch('/api/health')
      .then(response => {
        if (response.ok) {
          setApiStatus('Connected to Backend!');
        } else {
          setApiStatus('Backend responded but with an error');
        }
        return response.text();
      })
      .then(data => {
        console.log('Backend response:', data);
      })
      .catch(error => {
        console.error('Connection error:', error);
        setApiStatus('Failed to connect to backend');
      });
  }, []);

  return (
    <div className="App">
      <h1>🛫 Trip Booking Assistant</h1>
      <h2>Hello World!</h2>
      <p>Welcome to your AI-powered trip booking assistant.</p>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
        }}
      >
        <h3>System Status</h3>
        <p>Frontend: ✅ Running on port 3001</p>
        <p>Backend API: {apiStatus}</p>
        <p>Backend URL: {backendUrl}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          This is a test page to verify that the local development server is working correctly.
        </p>
      </div>
    </div>
  );
}

export default App;
