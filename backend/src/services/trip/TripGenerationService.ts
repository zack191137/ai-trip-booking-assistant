import { TripPlan, TripPreferences, FlightDetails, HotelDetails, RestaurantDetails, DayPlan, Activity } from '../../types';
import { storage } from '../storage';
import { llmService } from '../llm';
import { promptManager } from '../prompts';
import { AppError } from '../../middleware/errorHandler';

export class TripGenerationService {
  async generateTrip(conversationId: string, userId: string): Promise<TripPlan> {
    // Get conversation and validate
    const conversation = await storage.conversations.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found or access denied', 404, 'CONVERSATION_NOT_FOUND');
    }

    const preferences = conversation.extractedPreferences;
    if (!preferences.destination || !preferences.startDate || !preferences.endDate) {
      throw new AppError('Insufficient trip information. Please provide destination and dates.', 400, 'INSUFFICIENT_TRIP_INFO');
    }

    // Generate trip plan using LLM
    const tripPlan = await this.createTripPlan(preferences, userId, conversationId);
    
    // Save trip plan
    const savedTrip = await storage.trips.create(tripPlan);
    
    return savedTrip;
  }

  private async createTripPlan(preferences: TripPreferences, userId: string, conversationId: string): Promise<Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>> {
    const duration = this.calculateDuration(preferences.startDate!, preferences.endDate!);
    
    // Generate recommendations using prompts and LLM
    const [flightRecommendations, hotelRecommendations, restaurantRecommendations] = await Promise.all([
      this.generateFlightRecommendations(preferences),
      this.generateHotelRecommendations(preferences),
      this.generateRestaurantRecommendations(preferences)
    ]);

    // Parse recommendations into structured data
    const flights = this.parseFlightRecommendations(flightRecommendations, preferences);
    const hotels = this.parseHotelRecommendations(hotelRecommendations, preferences);
    const restaurants = this.parseRestaurantRecommendations(restaurantRecommendations, preferences);

    // Calculate total cost
    const totalEstimatedCost = this.calculateTotalCost(flights, hotels, restaurants);

    // Generate day-by-day itinerary
    const itinerary = await this.generateItinerary(preferences, flights, hotels, restaurants);

    return {
      userId,
      conversationId,
      status: 'draft',
      destination: preferences.destination!,
      startDate: preferences.startDate!,
      endDate: preferences.endDate!,
      travelers: preferences.travelers || 1,
      flights,
      hotels,
      restaurants,
      totalEstimatedCost,
      itinerary,
    };
  }

  private async generateFlightRecommendations(preferences: TripPreferences): Promise<string> {
    const prompt = promptManager.getPrompt('flight_search', {
      destination: preferences.destination,
      startDate: preferences.startDate?.toDateString(),
      endDate: preferences.endDate?.toDateString(),
      travelers: preferences.travelers || 1,
      budget: preferences.budget ? `$${preferences.budget.min}-$${preferences.budget.max} ${preferences.budget.currency}` : 'Not specified',
      flightPreferences: JSON.stringify(preferences.flightPreferences || {}),
    });

    return await llmService.generateResponse(prompt);
  }

  private async generateHotelRecommendations(preferences: TripPreferences): Promise<string> {
    const prompt = promptManager.getPrompt('hotel_search', {
      destination: preferences.destination,
      startDate: preferences.startDate?.toDateString(),
      endDate: preferences.endDate?.toDateString(),
      travelers: preferences.travelers || 1,
      budget: preferences.budget ? `$${preferences.budget.min}-$${preferences.budget.max} ${preferences.budget.currency}` : 'Not specified',
      hotelPreferences: JSON.stringify(preferences.hotelPreferences || {}),
    });

    return await llmService.generateResponse(prompt);
  }

  private async generateRestaurantRecommendations(preferences: TripPreferences): Promise<string> {
    const prompt = promptManager.getPrompt('restaurant_search', {
      destination: preferences.destination,
      startDate: preferences.startDate?.toDateString(),
      endDate: preferences.endDate?.toDateString(),
      travelers: preferences.travelers || 1,
      budget: preferences.budget ? `$${preferences.budget.min}-$${preferences.budget.max} ${preferences.budget.currency}` : 'Not specified',
      restaurantPreferences: JSON.stringify(preferences.restaurantPreferences || {}),
    });

    return await llmService.generateResponse(prompt);
  }

  private parseFlightRecommendations(recommendations: string, preferences: TripPreferences): FlightDetails[] {
    // For P0, create mock flight data based on LLM recommendations
    // In P1, this will parse real API responses
    const defaultPrice = this.estimateFlightPrice(preferences);
    
    return [
      {
        airline: 'American Airlines',
        flightNumber: 'AA1234',
        departure: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
        arrival: this.getDestinationAirport(preferences.destination!),
        departureTime: preferences.startDate!,
        arrivalTime: new Date(preferences.startDate!.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
        price: { amount: defaultPrice, currency: 'USD' },
        class: preferences.flightPreferences?.class || 'economy',
        bookingUrl: 'https://www.aa.com/booking',
      },
      {
        airline: 'Delta Air Lines',
        flightNumber: 'DL5678',
        departure: this.getDestinationAirport(preferences.destination!),
        arrival: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
        departureTime: preferences.endDate!,
        arrivalTime: new Date(preferences.endDate!.getTime() + 8 * 60 * 60 * 1000),
        price: { amount: defaultPrice, currency: 'USD' },
        class: preferences.flightPreferences?.class || 'economy',
        bookingUrl: 'https://www.delta.com/booking',
      },
    ];
  }

  private parseHotelRecommendations(recommendations: string, preferences: TripPreferences): HotelDetails[] {
    // For P0, create mock hotel data
    const nightlyRate = this.estimateHotelPrice(preferences);
    
    return [
      {
        name: `${preferences.destination} Grand Hotel`,
        address: `123 Main Street, ${preferences.destination}`,
        checkIn: preferences.startDate!,
        checkOut: preferences.endDate!,
        roomType: 'Standard Double Room',
        price: { amount: nightlyRate, currency: 'USD' },
        amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant'],
        rating: 4.2,
        bookingUrl: 'https://www.booking.com',
      },
    ];
  }

  private parseRestaurantRecommendations(recommendations: string, preferences: TripPreferences): RestaurantDetails[] {
    // For P0, create mock restaurant data
    const avgPrice = this.estimateRestaurantPrice(preferences);
    const duration = this.calculateDuration(preferences.startDate!, preferences.endDate!);
    const restaurants: RestaurantDetails[] = [];

    // Generate restaurants for each day
    for (let day = 0; day < duration; day++) {
      const date = new Date(preferences.startDate!);
      date.setDate(date.getDate() + day);
      
      restaurants.push({
        name: `Local Cuisine Restaurant ${day + 1}`,
        address: `${day + 1}00 Restaurant Street, ${preferences.destination}`,
        reservationTime: new Date(date.getTime() + 19 * 60 * 60 * 1000), // 7 PM
        cuisine: preferences.restaurantPreferences?.cuisines?.[0] || 'Local',
        priceRange: preferences.restaurantPreferences?.priceRange || 'mid-range',
        rating: 4.0 + Math.random() * 1.0,
        bookingUrl: 'https://www.opentable.com',
      });
    }

    return restaurants;
  }

  private async generateItinerary(
    preferences: TripPreferences,
    flights: FlightDetails[],
    hotels: HotelDetails[],
    restaurants: RestaurantDetails[]
  ): Promise<DayPlan[]> {
    const duration = this.calculateDuration(preferences.startDate!, preferences.endDate!);
    const itinerary: DayPlan[] = [];

    for (let day = 0; day < duration; day++) {
      const date = new Date(preferences.startDate!);
      date.setDate(date.getDate() + day);

      const activities: Activity[] = [];

      // Add flight activities for first and last day
      if (day === 0) {
        const outboundFlight = flights.find(f => f.departureTime.toDateString() === date.toDateString());
        if (outboundFlight) {
          activities.push({
            name: `Flight ${outboundFlight.flightNumber}`,
            time: outboundFlight.departureTime.toTimeString().slice(0, 5),
            type: 'flight',
            details: outboundFlight,
          });
        }
        // Hotel check-in
        activities.push({
          name: `Check-in at ${hotels[0]?.name || 'Hotel'}`,
          time: '15:00',
          type: 'hotel_checkin',
          details: hotels[0],
        });
      }

      if (day === duration - 1) {
        // Hotel check-out
        activities.push({
          name: `Check-out from ${hotels[0]?.name || 'Hotel'}`,
          time: '11:00',
          type: 'hotel_checkout',
          details: hotels[0],
        });
        
        const returnFlight = flights.find(f => f.departureTime.toDateString() === date.toDateString());
        if (returnFlight) {
          activities.push({
            name: `Flight ${returnFlight.flightNumber}`,
            time: returnFlight.departureTime.toTimeString().slice(0, 5),
            type: 'flight',
            details: returnFlight,
          });
        }
      }

      // Add restaurant reservations
      const dayRestaurant = restaurants.find(r => r.reservationTime.toDateString() === date.toDateString());
      if (dayRestaurant) {
        activities.push({
          name: `Dinner at ${dayRestaurant.name}`,
          time: dayRestaurant.reservationTime.toTimeString().slice(0, 5),
          type: 'restaurant',
          details: dayRestaurant,
        });
      }

      // Add free time activities
      if (day > 0 && day < duration - 1) {
        activities.push({
          name: 'Morning sightseeing',
          time: '10:00',
          type: 'free_time',
          details: { activity: 'Morning sightseeing', description: 'Explore local attractions' },
        });
        activities.push({
          name: 'Lunch and shopping',
          time: '14:00',
          type: 'free_time',
          details: { activity: 'Afternoon activities', description: 'Free time for shopping or relaxation' },
        });
      }

      // Sort activities by time
      activities.sort((a, b) => a.time.localeCompare(b.time));

      itinerary.push({
        date,
        activities,
      });
    }

    return itinerary;
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
  }

  private calculateTotalCost(flights: FlightDetails[], hotels: HotelDetails[], restaurants: RestaurantDetails[]) {
    const flightCost = flights.reduce((sum, flight) => sum + flight.price.amount, 0);
    const hotelCost = hotels.reduce((sum, hotel) => {
      const nights = this.calculateDuration(hotel.checkIn, hotel.checkOut) - 1;
      return sum + (hotel.price.amount * nights);
    }, 0);
    const restaurantCost = restaurants.reduce((sum, restaurant) => sum + this.estimateRestaurantPrice({ restaurantPreferences: { priceRange: restaurant.priceRange } }), 0);

    return {
      amount: flightCost + hotelCost + restaurantCost,
      currency: 'USD',
    };
  }

  private estimateFlightPrice(preferences: TripPreferences): number {
    const basePrice = 500; // Base flight price
    const classMultiplier = preferences.flightPreferences?.class === 'business' ? 3 : 
                           preferences.flightPreferences?.class === 'first' ? 5 : 1;
    return basePrice * classMultiplier;
  }

  private estimateHotelPrice(preferences: TripPreferences): number {
    const stars = preferences.hotelPreferences?.stars || 3;
    return stars * 50; // $50 per star per night
  }

  private estimateRestaurantPrice(preferences: Partial<TripPreferences>): number {
    const priceRange = preferences.restaurantPreferences?.priceRange || 'mid-range';
    const prices = {
      'budget': 25,
      'mid-range': 50,
      'upscale': 100,
      'fine-dining': 200,
    };
    return prices[priceRange as keyof typeof prices] || 50;
  }

  private getDestinationAirport(destination: string) {
    // Simple mapping for common destinations
    const airports: Record<string, any> = {
      'Paris': { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
      'London': { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
      'Tokyo': { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
      'Rome': { code: 'FCO', name: 'Leonardo da Vinci Airport', city: 'Rome', country: 'Italy' },
    };
    
    return airports[destination] || { code: 'XXX', name: `${destination} Airport`, city: destination, country: 'Unknown' };
  }

  // Public methods for trip management
  async getTripsByUser(userId: string): Promise<TripPlan[]> {
    return await storage.trips.findByUserId(userId);
  }

  async getTripById(tripId: string, userId: string): Promise<TripPlan | null> {
    const trip = await storage.trips.findById(tripId);
    if (!trip || trip.userId !== userId) {
      return null;
    }
    return trip;
  }

  async updateTrip(tripId: string, userId: string, updates: Partial<TripPlan>): Promise<TripPlan | null> {
    const trip = await storage.trips.findById(tripId);
    if (!trip || trip.userId !== userId) {
      return null;
    }

    return await storage.trips.update(tripId, updates);
  }

  async confirmTrip(tripId: string, userId: string): Promise<TripPlan | null> {
    return await this.updateTrip(tripId, userId, { status: 'confirmed' });
  }

  async deleteTrip(tripId: string, userId: string): Promise<boolean> {
    const trip = await storage.trips.findById(tripId);
    if (!trip || trip.userId !== userId) {
      return false;
    }

    return await storage.trips.delete(tripId);
  }
}

export const tripGenerationService = new TripGenerationService();

/*
 * NOTE: This is a P0 implementation with mock data generation.
 * For P1 enhancements:
 * - Integrate with real flight APIs (Amadeus, etc.)
 * - Use actual hotel booking APIs
 * - Connect to restaurant reservation systems
 * - Add real-time pricing and availability
 * - Implement advanced trip optimization algorithms
 * - Add machine learning for personalized recommendations
 */