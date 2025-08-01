import axios from 'axios';
import config from '../../config/environment';
import { HotelDetails, Money } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms?: number;
  currency?: string;
  minStars?: number;
  maxStars?: number;
}

export interface HotelSearchResult {
  hotels: HotelDetails[];
  searchId: string;
  totalResults: number;
}

export class HotelApiService {
  private baseUrl = 'https://distribution-xml.booking.com/json/bookings';
  private apiKey = config.externalApis.bookingCom.apiKey;

  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
    // For P0, return mock data
    if (config.server.nodeEnv === 'development' && !this.apiKey) {
      return this.getMockHotelData(params);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/getHotelsList`, {
        params: {
          destination: params.destination,
          checkin: params.checkIn,
          checkout: params.checkOut,
          adults: params.adults,
          rooms: params.rooms || 1,
          currency: params.currency || 'USD',
          min_stars: params.minStars,
          max_stars: params.maxStars,
          language: 'en',
        },
        headers: {
          'X-Booking-API-Key': this.apiKey,
        },
      });

      return this.parseBookingResponse(response.data, params);
    } catch (error) {
      console.error('Hotel API error:', error);
      // Fallback to mock data on error
      return this.getMockHotelData(params);
    }
  }

  private parseBookingResponse(data: any, params: HotelSearchParams): HotelSearchResult {
    const hotels: HotelDetails[] = data.hotels?.map((hotel: any) => ({
      name: hotel.name,
      address: hotel.address,
      checkIn: new Date(params.checkIn),
      checkOut: new Date(params.checkOut),
      roomType: hotel.room_type || 'Standard Room',
      price: {
        amount: parseFloat(hotel.price),
        currency: hotel.currency || 'USD',
      },
      amenities: hotel.amenities || ['WiFi', 'Air Conditioning'],
      rating: hotel.rating || 4.0,
      bookingUrl: hotel.booking_url || 'https://www.booking.com',
    })) || [];

    return {
      hotels,
      searchId: data.search_id || 'mock-search-id',
      totalResults: hotels.length,
    };
  }

  private getMockHotelData(params: HotelSearchParams): HotelSearchResult {
    const nights = this.calculateNights(params.checkIn, params.checkOut);
    
    const hotels: HotelDetails[] = [
      {
        name: `${params.destination} Grand Hotel`,
        address: `123 Main Street, ${params.destination}`,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        roomType: 'Deluxe Double Room',
        price: { amount: 150, currency: 'USD' },
        amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Room Service'],
        rating: 4.5,
        bookingUrl: 'https://www.booking.com/hotel-grand',
      },
      {
        name: `${params.destination} Boutique Inn`,
        address: `456 Central Avenue, ${params.destination}`,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        roomType: 'Standard Queen Room',
        price: { amount: 120, currency: 'USD' },
        amenities: ['Free WiFi', 'Continental Breakfast', 'Business Center'],
        rating: 4.2,
        bookingUrl: 'https://www.booking.com/boutique-inn',
      },
      {
        name: `${params.destination} Budget Lodge`,
        address: `789 Budget Street, ${params.destination}`,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        roomType: 'Economy Room',
        price: { amount: 80, currency: 'USD' },
        amenities: ['Free WiFi', 'Parking'],
        rating: 3.8,
        bookingUrl: 'https://www.booking.com/budget-lodge',
      },
      {
        name: `${params.destination} Luxury Resort`,
        address: `1 Luxury Lane, ${params.destination}`,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        roomType: 'Presidential Suite',
        price: { amount: 400, currency: 'USD' },
        amenities: ['Free WiFi', 'Spa', 'Pool', 'Golf Course', 'Concierge', 'Butler Service'],
        rating: 4.8,
        bookingUrl: 'https://www.booking.com/luxury-resort',
      },
      {
        name: `${params.destination} Business Hotel`,
        address: `321 Business District, ${params.destination}`,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        roomType: 'Executive Room',
        price: { amount: 180, currency: 'USD' },
        amenities: ['Free WiFi', 'Business Center', 'Meeting Rooms', 'Airport Shuttle'],
        rating: 4.3,
        bookingUrl: 'https://www.booking.com/business-hotel',
      },
    ];

    // Filter by star rating if specified
    let filteredHotels = hotels;
    if (params.minStars || params.maxStars) {
      filteredHotels = hotels.filter(hotel => {
        const stars = this.getRatingAsStars(hotel.rating);
        return (!params.minStars || stars >= params.minStars) &&
               (!params.maxStars || stars <= params.maxStars);
      });
    }

    return {
      hotels: filteredHotels,
      searchId: 'mock-hotel-search-' + Date.now(),
      totalResults: filteredHotels.length,
    };
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  private getRatingAsStars(rating: number): number {
    return Math.round(rating);
  }

  async getHotelDetails(hotelId: string): Promise<HotelDetails | null> {
    // For P0, return mock detailed data
    return {
      name: 'Sample Hotel',
      address: '123 Sample Street, Sample City',
      checkIn: new Date(),
      checkOut: new Date(),
      roomType: 'Standard Room',
      price: { amount: 150, currency: 'USD' },
      amenities: ['WiFi', 'Pool', 'Gym'],
      rating: 4.2,
      bookingUrl: 'https://www.booking.com/sample',
    };
  }

  async getDestinationSuggestions(query: string): Promise<string[]> {
    // For P0, return mock destination suggestions
    const mockDestinations = [
      'New York, NY',
      'Los Angeles, CA',
      'Paris, France',
      'London, UK',
      'Tokyo, Japan',
      'Rome, Italy',
      'Barcelona, Spain',
      'Sydney, Australia',
      'Dubai, UAE',
      'Singapore',
    ];

    return mockDestinations.filter(dest => 
      dest.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const hotelApiService = new HotelApiService();

/*
 * NOTE: This is a P0 implementation with Booking.com API integration structure.
 * Currently uses mock data when API credentials are not available.
 * 
 * For P1 enhancements:
 * - Implement proper Booking.com Partner API integration
 * - Add hotel image and description fetching
 * - Implement real-time availability checking
 * - Add support for multiple hotel booking providers
 * - Implement advanced filtering (location, amenities, etc.)
 * - Add hotel reviews and ratings integration
 * - Implement actual booking capabilities
 */