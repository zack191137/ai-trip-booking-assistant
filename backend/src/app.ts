import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import config from './config/environment';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import Logger from './services/logging/Logger';

import mainRoutes from './routes';
import { initializeChatService } from './services/chat/ChatService';

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      // CORS handling moved to Nginx
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
    this.initializeChatService();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for development
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow OAuth popups
    }));

    // CORS handling moved to Nginx

    // Rate limiting
    this.app.use('/api/', apiLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (config.server.nodeEnv !== 'test') {
      this.app.use(morgan('combined', { stream: (Logger as any).stream }));
    }

    // Request timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      next();
    });
  }

  private initializeRoutes(): void {
    // Main API routes
    this.app.use('/api', mainRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          message: 'Trip Booking Assistant API',
          version: '1.0.0',
          status: 'running',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    // Basic Socket.IO setup - detailed handlers are in ChatService
    console.log('Socket.IO server initialized');
  }

  private initializeChatService(): void {
    initializeChatService(this.io);
    console.log('Chat service initialized with WebSocket support');
  }

  public listen(): void {
    this.server.listen(config.server.port, config.server.host, () => {
      console.log(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
    });
  }

  public getServer() {
    return this.server;
  }

  public getIO() {
    return this.io;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

export default App;