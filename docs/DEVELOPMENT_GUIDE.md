# Development Guide - Trip Booking Assistant

This guide covers everything you need to know for local development of the Trip Booking Assistant frontend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Backend deployed and running on Digital Ocean

### Setup Local Development
```bash
# 1. Navigate to frontend directory
cd /Users/zz/Projects/trip-booking-assistant/frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Start development server
npm run dev
```

### Expected Output
```bash
VITE v7.0.6  ready in 614 ms

➜  Local:   http://localhost:3001/
➜  Network: http://10.0.0.215:3001/
➜  press h + enter to show help
```

## 🔄 Development Workflow

### Hot Module Replacement (HMR)
The development server provides instant feedback:
- **File changes** → Automatic rebuild
- **Browser updates** → No manual refresh needed
- **State preservation** → React components maintain state during updates

### Watched Files
- ✅ React components (`src/**/*.tsx`)
- ✅ TypeScript files (`src/**/*.ts`)
- ✅ CSS files (`src/**/*.css`)
- ✅ Configuration files (`vite.config.ts`, `package.json`)

### Dev Server Commands
While the server is running, press:
- `r` + Enter → Force reload
- `u` + Enter → Show server URLs
- `o` + Enter → Open in browser
- `c` + Enter → Clear console
- `q` + Enter → Quit server
- `h` + Enter → Show help

## 🌐 Environment Configuration

### Development URLs
- **Frontend:** http://localhost:3001
- **Backend API:** https://ai.zackz.net:3000 (proxied)
- **WebSocket:** wss://ai.zackz.net:3000 (proxied)

### Environment Variables (`.env.local`)
```env
# API Configuration
VITE_API_BASE_URL=https://ai.zackz.net:3000/api
VITE_WS_URL=wss://ai.zackz.net:3000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=478475196682-od9mrskbmoqn5nouv66s3b9rbe1p8lfa.apps.googleusercontent.com

# Environment
VITE_ENVIRONMENT=development
```

### API Proxy Configuration
The `vite.config.ts` automatically proxies:
- `/api/*` → `https://ai.zackz.net:3000`
- `/socket.io` → `wss://ai.zackz.net:3000`

This means you can make API calls to `/api/health` and they'll be automatically routed to the backend.

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── common/       # Shared UI components
│   │   ├── chat/         # Chat interface components
│   │   ├── trip/         # Trip-related components
│   │   └── layout/       # Layout components
│   ├── contexts/         # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API and WebSocket services
│   │   ├── api/         # HTTP API calls
│   │   ├── websocket/   # WebSocket management
│   │   └── storage/     # Local storage utilities
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── styles/          # Global styles and themes
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Application entry point
├── .env.local           # Development environment variables
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint rules
├── .prettierrc          # Prettier formatting rules
└── README.md            # Project documentation
```

## 🛠️ Development Scripts

### Primary Commands
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run ESLint (check for issues)
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# TypeScript type checking
npm run type-check
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e
```

## 🧪 Testing Your Setup

### 1. Verify Development Server
- Navigate to http://localhost:3001
- Should see "Trip Booking Assistant" hello world page
- Check system status shows backend connectivity

### 2. Test Hot Reload
1. Edit `src/App.tsx`
2. Change the heading text: `<h1>🛫 My Trip Booking Assistant</h1>`
3. Save the file
4. Browser should update instantly without refresh

### 3. Test API Connection
- Open browser DevTools (F12)
- Check Console for any connection errors
- Check Network tab for successful API calls
- Backend status should show "Connected to Backend!"

### 4. Verify Proxy
```bash
# In browser console, test API call:
fetch('/api/health').then(r => r.text()).then(console.log)
```

## 🔧 Development Tools

### Browser Extensions
- **React Developer Tools** - Debug React components
- **Redux DevTools** - For state management (when implemented)
- **Vite DevTools** - Inspect Vite build process

### IDE Setup
- **VS Code Extensions:**
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Auto Rename Tag
  - Prettier - Code formatter
  - ESLint

### Debugging
- **Source Maps:** Enabled for debugging TypeScript in browser
- **React DevTools:** Inspect component tree and props
- **Network Tab:** Monitor API calls and responses
- **Console:** View application logs and errors

## 🎨 Styling and UI

### Current Setup
- **Material-UI (MUI)** - Component library
- **Emotion** - CSS-in-JS for styling
- **Dark Theme** - Default theme configuration

### Theme Configuration
Located in `src/styles/theme.ts` (to be created):
```typescript
// Dark theme with modern colors
// Custom component overrides
// Responsive breakpoints
```

## 🔐 Authentication

### Google OAuth Setup
- **Client ID:** Configured in environment variables
- **Redirect URIs:** Must be configured in Google Cloud Console
- **Development:** Works with localhost:3001

### Backend Integration
- JWT tokens for session management
- Automatic token refresh
- Protected route handling

## 📡 API Integration

### HTTP Calls
```typescript
// Example API call structure
import { apiClient } from '@/services/api/client';

const response = await apiClient.get('/health');
```

### WebSocket Connection
```typescript
// Real-time chat functionality
import { socketClient } from '@/services/websocket/socketClient';

socketClient.connect(token);
socketClient.sendMessage(conversationId, content);
```

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Files generated in ./dist/
```

### Docker Build
```bash
# Build production Docker image
docker build -t ai-booking-frontend .
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://ai.zackz.net:3000/api
VITE_WS_URL=wss://ai.zackz.net:3000
VITE_GOOGLE_CLIENT_ID=your-production-client-id
VITE_ENVIRONMENT=production
```

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
npm run dev -- --port 3002
```

### CORS Issues
- Handled by Vite proxy configuration
- If issues persist, check backend CORS settings

### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Hot Reload Not Working
```bash
# Restart development server
# Check file permissions
# Verify file watcher limits (Linux/macOS)
```

## 📚 Next Steps

### Immediate Development Tasks
1. **Chat Interface** - Real-time messaging component
2. **Trip Planning** - Multi-step form for preferences
3. **Authentication** - Google OAuth integration
4. **Trip Display** - Itinerary visualization
5. **PDF Export** - Generate trip documents

### Implementation Order
1. Set up routing and layout
2. Create authentication flow
3. Build chat interface with WebSocket
4. Implement trip planning forms
5. Add trip visualization components
6. Integrate PDF generation
7. Add error handling and loading states

## 🆘 Getting Help

### Documentation
- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Vite:** https://vitejs.dev/guide/
- **Material-UI:** https://mui.com/getting-started/

### Debugging Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check environment variables are loaded
4. Restart development server
5. Clear browser cache and cookies

---

**Happy coding! 🚀** The development server provides instant feedback, so you can iterate quickly and see your changes immediately.