import dotenv from 'dotenv';

dotenv.config();

interface Config {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  llm: {
    geminiApiKey: string;
  };
  externalApis: {
    amadeus: {
      apiKey: string;
      apiSecret: string;
    };
    bookingCom: {
      apiKey: string;
    };
    googlePlaces: {
      apiKey: string;
    };
  };
  rateLimiting: {
    apiPerMinute: number;
    llmPerMinute: number;
  };
  cors: {
    allowedOrigins: string[];
  };
  storage: {
    doSpaces: {
      endpoint: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  externalApis: {
    amadeus: {
      apiKey: process.env.AMADEUS_API_KEY || '',
      apiSecret: process.env.AMADEUS_API_SECRET || '',
    },
    bookingCom: {
      apiKey: process.env.BOOKING_COM_API_KEY || '',
    },
    googlePlaces: {
      apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    },
  },
  rateLimiting: {
    apiPerMinute: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '100', 10),
    llmPerMinute: parseInt(process.env.LLM_RATE_LIMIT_PER_MINUTE || '20', 10),
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  storage: {
    doSpaces: {
      endpoint: process.env.DO_SPACES_ENDPOINT || '',
      bucket: process.env.DO_SPACES_BUCKET || '',
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY || '',
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;