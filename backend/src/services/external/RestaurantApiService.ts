import axios from 'axios';
import config from '../../config/environment';
import { RestaurantDetails } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export interface RestaurantSearchParams {
  location: string;
  cuisine?: string;
  priceRange?: 'budget' | 'mid-range' | 'upscale' | 'fine-dining';
  rating?: number;
  date?: string;
  partySize?: number;
}

export interface RestaurantSearchResult {
  restaurants: RestaurantDetails[];
  totalResults: number;
}

export class RestaurantApiService {
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private apiKey = config.externalApis.googlePlaces.apiKey;

  async searchRestaurants(params: RestaurantSearchParams): Promise<RestaurantSearchResult> {
    // For P0, return mock data
    if (config.server.nodeEnv === 'development' && !this.apiKey) {
      return this.getMockRestaurantData(params);
    }

    try {
      // First, search for restaurants using Google Places API
      const searchResponse = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: `restaurants in ${params.location} ${params.cuisine || ''}`,
          type: 'restaurant',
          key: this.apiKey,
        },
      });

      const restaurants = await this.parseGooglePlacesResponse(searchResponse.data, params);
      
      return {
        restaurants,
        totalResults: restaurants.length,
      };
    } catch (error) {
      console.error('Restaurant API error:', error);
      // Fallback to mock data on error
      return this.getMockRestaurantData(params);
    }
  }

  private async parseGooglePlacesResponse(data: any, params: RestaurantSearchParams): Promise<RestaurantDetails[]> {
    const restaurants: RestaurantDetails[] = [];

    for (const place of data.results?.slice(0, 10) || []) {
      try {
        // Get detailed information for each restaurant
        const detailsResponse = await axios.get(`${this.baseUrl}/details/json`, {
          params: {
            place_id: place.place_id,
            fields: 'name,formatted_address,rating,price_level,cuisine,opening_hours,website',
            key: this.apiKey,
          },
        });

        const details = detailsResponse.data.result;
        
        restaurants.push({
          name: details.name || place.name,
          address: details.formatted_address || place.formatted_address,
          reservationTime: this.generateReservationTime(params.date),
          cuisine: this.determineCuisine(details, params.cuisine),
          priceRange: this.mapPriceLevel(details.price_level) || params.priceRange || 'mid-range',
          rating: details.rating || place.rating || 4.0,
          bookingUrl: details.website || 'https://www.opentable.com',
        });
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
        // Continue with next restaurant
      }
    }

    return restaurants;
  }

  private generateReservationTime(date?: string): Date {
    const reservationDate = date ? new Date(date) : new Date();
    reservationDate.setHours(19, 0, 0, 0); // Default to 7 PM
    return reservationDate;
  }

  private determineCuisine(details: any, requestedCuisine?: string): string {
    if (requestedCuisine) return requestedCuisine;
    
    // Try to extract cuisine from Google Places data
    if (details.types) {
      const cuisineTypes = details.types.filter((type: string) => 
        ['italian', 'chinese', 'japanese', 'mexican', 'indian', 'french', 'thai'].includes(type)
      );
      if (cuisineTypes.length > 0) {
        return cuisineTypes[0].charAt(0).toUpperCase() + cuisineTypes[0].slice(1);
      }
    }
    
    return 'International';
  }

  private mapPriceLevel(priceLevel?: number): string {
    const mapping: Record<number, string> = {
      1: 'budget',
      2: 'mid-range',
      3: 'upscale',
      4: 'fine-dining',
    };
    return mapping[priceLevel || 2];
  }

  private getMockRestaurantData(params: RestaurantSearchParams): RestaurantSearchResult {
    const cuisines = ['Italian', 'French', 'Japanese', 'Mexican', 'Indian', 'Chinese', 'Thai', 'American'];
    const targetCuisine = params.cuisine || cuisines[Math.floor(Math.random() * cuisines.length)];
    
    const restaurants: RestaurantDetails[] = [
      {
        name: `Chez ${params.location}`,
        address: `123 Fine Dining Street, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: 'French',
        priceRange: 'fine-dining',
        rating: 4.8,
        bookingUrl: 'https://www.opentable.com/chez-restaurant',
      },
      {
        name: `${targetCuisine} Garden`,
        address: `456 Cuisine Avenue, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: targetCuisine,
        priceRange: params.priceRange || 'mid-range',
        rating: 4.3,
        bookingUrl: 'https://www.opentable.com/cuisine-garden',
      },
      {
        name: `Local Favorites`,
        address: `789 Local Street, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: 'Local',
        priceRange: 'mid-range',
        rating: 4.5,
        bookingUrl: 'https://www.opentable.com/local-favorites',
      },
      {
        name: `Budget Bites`,
        address: `321 Economy Lane, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: 'American',
        priceRange: 'budget',
        rating: 4.0,
        bookingUrl: 'https://www.opentable.com/budget-bites',
      },
      {
        name: `The Upscale Spot`,
        address: `654 Premium Boulevard, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: 'International',
        priceRange: 'upscale',
        rating: 4.6,
        bookingUrl: 'https://www.opentable.com/upscale-spot',
      },
      {
        name: `${targetCuisine} Express`,
        address: `987 Quick Street, ${params.location}`,
        reservationTime: this.generateReservationTime(params.date),
        cuisine: targetCuisine,
        priceRange: 'budget',
        rating: 3.9,
        bookingUrl: 'https://www.opentable.com/express',
      },
    ];

    // Filter by cuisine if specified
    let filteredRestaurants = restaurants;
    if (params.cuisine) {
      filteredRestaurants = restaurants.filter(restaurant => 
        restaurant.cuisine.toLowerCase().includes(params.cuisine!.toLowerCase())
      );
    }

    // Filter by price range if specified
    if (params.priceRange) {
      filteredRestaurants = filteredRestaurants.filter(restaurant => 
        restaurant.priceRange === params.priceRange
      );
    }

    // Filter by rating if specified
    if (params.rating) {
      filteredRestaurants = filteredRestaurants.filter(restaurant => 
        restaurant.rating >= params.rating!
      );
    }

    return {
      restaurants: filteredRestaurants,
      totalResults: filteredRestaurants.length,
    };
  }

  async getRestaurantAvailability(restaurantId: string, date: string, partySize: number): Promise<string[]> {
    // For P0, return mock available times
    const availableTimes = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
    
    // Simulate some times being unavailable
    const randomUnavailable = Math.floor(Math.random() * 3);
    return availableTimes.filter((_, index) => index % 3 !== randomUnavailable);
  }

  async getCuisineSuggestions(): Promise<string[]> {
    return [
      'Italian',
      'French',
      'Japanese',
      'Chinese',
      'Mexican',
      'Indian',
      'Thai',
      'Greek',
      'Spanish',
      'Korean',
      'Vietnamese',
      'American',
      'Mediterranean',
      'Middle Eastern',
      'Brazilian',
    ];
  }
}

export const restaurantApiService = new RestaurantApiService();

/*
 * NOTE: This is a P0 implementation with Google Places API integration structure.
 * Currently uses mock data when API credentials are not available.
 * 
 * For P1 enhancements:
 * - Implement full Google Places API integration
 * - Add OpenTable API for real reservations
 * - Implement Yelp API for reviews and ratings
 * - Add real-time availability checking
 * - Implement actual reservation booking
 * - Add dietary restriction filtering
 * - Implement restaurant image fetching
 * - Add table preference selection
 */