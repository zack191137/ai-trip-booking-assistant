import { InMemoryStorage } from './InMemoryStorage';
import { TripPlan } from '../../types';

export class TripStorage extends InMemoryStorage<TripPlan> {
  async findByUserId(userId: string): Promise<TripPlan[]> {
    return this.findAll({ userId });
  }

  async findByConversationId(conversationId: string): Promise<TripPlan[]> {
    return this.findAll({ conversationId });
  }

  async findByStatus(status: TripPlan['status']): Promise<TripPlan[]> {
    return this.findAll({ status });
  }

  async findUserTripsByStatus(userId: string, status: TripPlan['status']): Promise<TripPlan[]> {
    const userTrips = await this.findByUserId(userId);
    return userTrips.filter(trip => trip.status === status);
  }

  async updateStatus(tripId: string, status: TripPlan['status']): Promise<TripPlan | null> {
    return this.update(tripId, { status });
  }

  async updateItinerary(tripId: string, itinerary: TripPlan['itinerary']): Promise<TripPlan | null> {
    return this.update(tripId, { itinerary });
  }

  async updateCost(tripId: string, totalEstimatedCost: TripPlan['totalEstimatedCost']): Promise<TripPlan | null> {
    return this.update(tripId, { totalEstimatedCost });
  }
}

export const tripStorage = new TripStorage();