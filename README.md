# AI Trip Booking Assistant

An intelligent trip planning and booking assistant powered by Google Gemini AI. This application helps users plan trips through natural conversation, generate detailed itineraries, and manage bookings.

## Features

- 🤖 **AI-Powered Chat Interface**: Natural language trip planning with Google Gemini
- ✈️ **Smart Trip Generation**: Creates detailed itineraries based on preferences
- 🏨 **Booking Management**: Track flights, hotels, restaurants, and activities
- 📄 **PDF Export**: Generate professional trip documents
- 🔐 **Secure Authentication**: JWT-based auth with Google OAuth support
- 🌙 **Dark Theme**: Modern, eye-friendly interface
- 💬 **Real-time Updates**: WebSocket-powered chat experience

## Tech Stack

### Backend
- Node.js + Express.js + TypeScript
- Socket.IO for real-time communication
- JWT authentication
- Google Gemini AI integration
- In-memory storage (production-ready for database migration)

### Frontend
- React 18 + TypeScript + Vite
- Material-UI components
- React Context for state management
- Socket.IO client
- jsPDF for document generation

## Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-trip-booking-assistant.git
cd ai-trip-booking-assistant
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with backend URL
```

4. Start development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3000

## Project Structure

```
trip-booking-assistant/
├── backend/            # Node.js/Express backend
│   ├── src/           # Source code
│   ├── prompts/       # AI prompt templates
│   └── tests/         # Test files
├── frontend/          # React frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── tests/         # Test files
├── docker-compose.yml # Docker orchestration
└── deploy.sh         # Deployment script
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Trip Endpoints
- `GET /api/trips` - List user trips
- `GET /api/trips/:id` - Get trip details
- `POST /api/trips/:id/book` - Book trip activities

### Chat WebSocket Events
- `connection` - Initial handshake
- `message` - Send/receive messages
- `trip_generated` - Trip creation notification

## Deployment

See `deploy.sh` and `setup-server.sh` for automated deployment to DigitalOcean.

## License

MIT License