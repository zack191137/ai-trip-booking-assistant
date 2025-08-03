# Trip Booking Assistant - Frontend

## Overview
This is the frontend application for the AI-powered Trip Booking Assistant. Built with React, TypeScript, and Vite.

## Prerequisites
- Node.js 18+ and npm
- Backend API running (either locally or on Digital Ocean)

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and update the values:
```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3000/api)
- `VITE_WS_URL`: WebSocket URL for real-time chat
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:3001

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests with Vitest
- `npm run test:e2e` - Run e2e tests with Cypress

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   ├── services/       # API and WebSocket services
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles and theme
├── public/             # Static assets
├── Dockerfile          # Docker configuration
└── nginx.conf          # Nginx configuration for production
```

## Building for Production

### Local Build
```bash
npm run build
```

### Docker Build
```bash
docker build -t ai-booking-frontend .
```

## Deployment

The frontend is deployed as a Docker container alongside the backend. The deployment script handles:
1. Building the React application
2. Creating a Docker image with Nginx
3. Serving the static files and proxying API requests

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI
- **State Management**: React Context API
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client
- **Forms**: React Hook Form
- **PDF Generation**: jsPDF
- **Authentication**: Google OAuth

## Features

- Real-time chat interface
- Trip planning and visualization
- PDF export for itineraries
- Google OAuth authentication
- Dark mode by default
- Responsive design