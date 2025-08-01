import { tripGenerationService } from '../../../src/services/trip/TripGenerationService';
import { storage } from '../../../src/services/storage';
import { AppError } from '../../../src/middleware/errorHandler';
import { TripPreferences } from '../../../src/types';

// Mock LLM service
jest.mock('../../../src/services/llm', () => ({
  llmService: {
    generateResponse: jest.fn().mockResolvedValue('Mock LLM response')
  }
}));

describe('TripGenerationService', () => {
  let userId: string;
  let conversationId: string;

  beforeEach(async () => {
    await storage.clearAll();

    // Create test user
    const user = await storage.users.create({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    userId = user.id;

    // Create test conversation with preferences
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
      } as TripPreferences,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    conversationId = conversation.id;
  });

  afterEach(async () => {
    await storage.clearAll();
  });

  describe('generateTrip', () => {
    it('should successfully generate a trip plan', async () => {
      const trip = await tripGenerationService.generateTrip(conversationId, userId);

      expect(trip).toHaveProperty('id');
      expect(trip).toHaveProperty('destination', 'Paris');
      expect(trip).toHaveProperty('userId', userId);
      expect(trip).toHaveProperty('conversationId', conversationId);
      expect(trip).toHaveProperty('flights');
      expect(trip).toHaveProperty('hotels');
      expect(trip).toHaveProperty('restaurants');
      expect(trip).toHaveProperty('itinerary');
      expect(trip).toHaveProperty('totalEstimatedCost');
      expect(trip.status).toBe('draft');
    });

    it('should throw error for non-existent conversation', async () => {
      await expect(tripGenerationService.generateTrip('non-existent-id', userId))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for unauthorized access to conversation', async () => {
      await expect(tripGenerationService.generateTrip(conversationId, 'different-user-id'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for incomplete trip preferences', async () => {
      // Update conversation with incomplete preferences
      await storage.conversations.update(conversationId, {
        extractedPreferences: {
          destination: 'Paris',
          // Missing startDate and endDate
          travelers: 2
        } as TripPreferences
      });

      await expect(tripGenerationService.generateTrip(conversationId, userId))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getTripsByUser', () => {
    it('should return empty array for user with no trips', async () => {
      const trips = await tripGenerationService.getTripsByUser(userId);
      expect(trips).toEqual([]);
    });

    it('should return user trips only', async () => {
      // Generate trip for test user
      const trip1 = await tripGenerationService.generateTrip(conversationId, userId);

      // Create another user and trip
      const otherUser = await storage.users.create({
        id: 'other-user-id',
        name: 'Other User',
        email: 'other@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const otherConversation = await storage.conversations.create({
        id: 'other-conversation-id',
        userId: otherUser.id,
        messages: [],
        extractedPreferences: {
          destination: 'Tokyo',
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-05'),
          travelers: 1
        } as TripPreferences,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await tripGenerationService.generateTrip(otherConversation.id, otherUser.id);

      const userTrips = await tripGenerationService.getTripsByUser(userId);
      expect(userTrips).toHaveLength(1);
      expect(userTrips[0].id).toBe(trip1.id);
    });
  });

  describe('updateTrip', () => {
    let tripId: string;

    beforeEach(async () => {
      const trip = await tripGenerationService.generateTrip(conversationId, userId);
      tripId = trip.id;
    });

    it('should successfully update trip', async () => {
      const updates = {
        travelers: 3,
        status: 'confirmed' as const
      };

      const updatedTrip = await tripGenerationService.updateTrip(tripId, userId, updates);
      
      expect(updatedTrip).not.toBeNull();
      expect(updatedTrip!.travelers).toBe(3);
      expect(updatedTrip!.status).toBe('confirmed');
    });

    it('should return null for non-existent trip', async () => {
      const result = await tripGenerationService.updateTrip('non-existent-id', userId, {});
      expect(result).toBeNull();
    });

    it('should return null for unauthorized access', async () => {
      const result = await tripGenerationService.updateTrip(tripId, 'different-user-id', {});
      expect(result).toBeNull();
    });
  });

  describe('deleteTrip', () => {
    let tripId: string;

    beforeEach(async () => {
      const trip = await tripGenerationService.generateTrip(conversationId, userId);
      tripId = trip.id;
    });

    it('should successfully delete trip', async () => {
      const result = await tripGenerationService.deleteTrip(tripId, userId);
      expect(result).toBe(true);

      const trips = await tripGenerationService.getTripsByUser(userId);
      expect(trips).toHaveLength(0);
    });

    it('should return false for non-existent trip', async () => {
      const result = await tripGenerationService.deleteTrip('non-existent-id', userId);
      expect(result).toBe(false);
    });

    it('should return false for unauthorized access', async () => {
      const result = await tripGenerationService.deleteTrip(tripId, 'different-user-id');
      expect(result).toBe(false);
    });
  });
});