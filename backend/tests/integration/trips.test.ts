import request from 'supertest';
import App from '../../src/app';
import { storage } from '../../src/services/storage';

// Mock LLM service for consistent testing
jest.mock('../../src/services/llm', () => ({
  llmService: {
    generateResponse: jest.fn().mockResolvedValue('Mock LLM response for trip generation')
  }
}));

describe('Trips Integration Tests', () => {
  let app: App;
  let server: any;
  let accessToken: string;
  let userId: string;
  let conversationId: string;

  beforeAll(async () => {
    app = new App();
    server = app.app;
    await storage.clearAll();
  });

  afterAll(async () => {
    await storage.clearAll();
  });

  beforeEach(async () => {
    await storage.clearAll();

    // Register and login user
    const registerResponse = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      });

    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;

    // Create a conversation with preferences
    const conversation = await storage.conversations.create({
      id: 'test-conversation-id',
      userId,
      messages: [],
      extractedPreferences: {
        destination: 'Paris',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        travelers: 2,
        budget: {
          min: 1000,
          max: 3000,
          currency: 'USD'
        }
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    conversationId = conversation.id;
  });

  describe('POST /api/trips/generate', () => {
    it('should generate a trip successfully', async () => {
      const tripData = {
        conversationId
      };

      const response = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tripData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trip).toBeDefined();
      expect(response.body.data.trip.destination).toBe('Paris');
      expect(response.body.data.trip.userId).toBe(userId);
      expect(response.body.data.trip.status).toBe('draft');
    });

    it('should return 401 without authentication', async () => {
      const tripData = { conversationId };

      const response = await request(server)
        .post('/api/trips/generate')
        .send(tripData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent conversation', async () => {
      const tripData = {
        conversationId: 'non-existent-id'
      };

      const response = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tripData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/trips', () => {
    let tripId: string;

    beforeEach(async () => {
      const tripResponse = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId });
      
      tripId = tripResponse.body.data.trip.id;
    });

    it('should return user trips', async () => {
      const response = await request(server)
        .get('/api/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trips).toHaveLength(1);
      expect(response.body.data.trips[0].id).toBe(tripId);
    });

    it('should return empty array for user with no trips', async () => {
      // Create new user
      const newUserResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'testpassword123'
        });

      const response = await request(server)
        .get('/api/trips')
        .set('Authorization', `Bearer ${newUserResponse.body.data.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trips).toHaveLength(0);
    });
  });

  describe('GET /api/trips/:id', () => {
    let tripId: string;

    beforeEach(async () => {
      const tripResponse = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId });
      
      tripId = tripResponse.body.data.trip.id;
    });

    it('should return specific trip', async () => {
      const response = await request(server)
        .get(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trip.id).toBe(tripId);
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await request(server)
        .get('/api/trips/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/trips/:id', () => {
    let tripId: string;

    beforeEach(async () => {
      const tripResponse = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId });
      
      tripId = tripResponse.body.data.trip.id;
    });

    it('should update trip successfully', async () => {
      const updates = {
        travelers: 3,
        status: 'confirmed'
      };

      const response = await request(server)
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trip.travelers).toBe(3);
      expect(response.body.data.trip.status).toBe('confirmed');
    });

    it('should return 404 for non-existent trip', async () => {
      const updates = { travelers: 3 };

      const response = await request(server)
        .put('/api/trips/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/trips/:id', () => {
    let tripId: string;

    beforeEach(async () => {
      const tripResponse = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId });
      
      tripId = tripResponse.body.data.trip.id;
    });

    it('should delete trip successfully', async () => {
      const response = await request(server)
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify trip is deleted
      const getResponse = await request(server)
        .get(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await request(server)
        .delete('/api/trips/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PDF Generation Endpoints', () => {
    let tripId: string;

    beforeEach(async () => {
      const tripResponse = await request(server)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId });
      
      tripId = tripResponse.body.data.trip.id;
    });

    it('should generate standard trip PDF', async () => {
      const response = await request(server)
        .get(`/api/trips/${tripId}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate minimal trip PDF', async () => {
      const response = await request(server)
        .get(`/api/trips/${tripId}/pdf/minimal`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should generate detailed trip PDF', async () => {
      const response = await request(server)
        .get(`/api/trips/${tripId}/pdf/detailed`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should return 404 for non-existent trip PDF', async () => {
      const response = await request(server)
        .get('/api/trips/non-existent-id/pdf')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});