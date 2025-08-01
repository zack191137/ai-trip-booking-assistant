import axios from 'axios';
import config from '../../config/environment';
import { FlightDetails, Airport, Money } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  class?: 'economy' | 'business' | 'first';
  directOnly?: boolean;
}

export interface FlightSearchResult {
  flights: FlightDetails[];
  searchId: string;
  totalResults: number;
}

export class FlightApiService {
  private baseUrl = 'https://test.api.amadeus.com/v2';
  private apiKey = config.externalApis.amadeus.apiKey;
  private apiSecret = config.externalApis.amadeus.apiSecret;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    // For P0, return mock data
    if (config.server.nodeEnv === 'development' && !this.apiKey) {
      return this.getMockFlightData(params);
    }

    try {
      await this.ensureValidToken();
      
      const response = await axios.get(`${this.baseUrl}/shopping/flight-offers`, {
        params: {
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults,
          travelClass: params.class?.toUpperCase(),
          nonStop: params.directOnly,
          max: 10,
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return this.parseAmadeusResponse(response.data);
    } catch (error) {
      console.error('Flight API error:', error);
      // Fallback to mock data on error
      return this.getMockFlightData(params);
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
    } catch (error) {
      throw new AppError('Failed to authenticate with flight API', 500, 'FLIGHT_API_AUTH_FAILED');
    }
  }

  private parseAmadeusResponse(data: any): FlightSearchResult {
    const flights: FlightDetails[] = data.data?.map((offer: any) => {
      const itinerary = offer.itineraries[0];
      const segment = itinerary.segments[0];
      
      return {
        airline: segment.carrierCode,
        flightNumber: `${segment.carrierCode}${segment.number}`,
        departure: this.parseAirport(segment.departure),
        arrival: this.parseAirport(segment.arrival),
        departureTime: new Date(segment.departure.at),
        arrivalTime: new Date(segment.arrival.at),
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency,
        },
        class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin.toLowerCase(),
        bookingUrl: 'https://www.amadeus.com/booking',
      };
    }) || [];

    return {
      flights,
      searchId: data.meta?.searchId || 'mock-search-id',
      totalResults: flights.length,
    };
  }

  private parseAirport(airportData: any): Airport {
    return {
      code: airportData.iataCode,
      name: airportData.terminal ? `${airportData.iataCode} Terminal ${airportData.terminal}` : airportData.iataCode,
      city: 'Unknown', // Amadeus doesn't always provide city
      country: 'Unknown',
    };
  }

  private getMockFlightData(params: FlightSearchParams): FlightSearchResult {
    const basePrice = this.calculateMockPrice(params);
    
    const flights: FlightDetails[] = [
      {
        airline: 'American Airlines',
        flightNumber: 'AA1234',
        departure: { code: params.origin, name: `${params.origin} Airport`, city: 'Origin City', country: 'USA' },
        arrival: { code: params.destination, name: `${params.destination} Airport`, city: 'Destination City', country: 'Destination Country' },
        departureTime: new Date(params.departureDate + 'T08:00:00Z'),
        arrivalTime: new Date(params.departureDate + 'T16:00:00Z'),
        price: { amount: basePrice, currency: 'USD' },
        class: params.class || 'economy',
        bookingUrl: 'https://www.aa.com/booking',
      },
      {
        airline: 'Delta Air Lines',
        flightNumber: 'DL5678',
        departure: { code: params.origin, name: `${params.origin} Airport`, city: 'Origin City', country: 'USA' },
        arrival: { code: params.destination, name: `${params.destination} Airport`, city: 'Destination City', country: 'Destination Country' },
        departureTime: new Date(params.departureDate + 'T12:00:00Z'),
        arrivalTime: new Date(params.departureDate + 'T20:00:00Z'),
        price: { amount: basePrice + 50, currency: 'USD' },
        class: params.class || 'economy',
        bookingUrl: 'https://www.delta.com/booking',
      },
    ];

    // Add return flights if return date is specified
    if (params.returnDate) {
      flights.push({
        airline: 'American Airlines',
        flightNumber: 'AA4321',
        departure: { code: params.destination, name: `${params.destination} Airport`, city: 'Destination City', country: 'Destination Country' },
        arrival: { code: params.origin, name: `${params.origin} Airport`, city: 'Origin City', country: 'USA' },
        departureTime: new Date(params.returnDate + 'T10:00:00Z'),
        arrivalTime: new Date(params.returnDate + 'T18:00:00Z'),
        price: { amount: basePrice, currency: 'USD' },
        class: params.class || 'economy',
        bookingUrl: 'https://www.aa.com/booking',
      });
    }

    return {
      flights,
      searchId: 'mock-search-' + Date.now(),
      totalResults: flights.length,
    };
  }

  private calculateMockPrice(params: FlightSearchParams): number {
    let basePrice = 400;
    
    // Adjust for class
    if (params.class === 'business') basePrice *= 3;
    else if (params.class === 'first') basePrice *= 5;
    
    // Adjust for number of passengers
    basePrice *= params.adults;
    
    // Add some randomness
    basePrice += Math.floor(Math.random() * 200);
    
    return basePrice;
  }

  async getAirportSuggestions(query: string): Promise<Airport[]> {
    // For P0, return mock airport data
    const mockAirports: Airport[] = [
      { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
      { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
      { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
      { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
      { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
    ];

    return mockAirports.filter(airport => 
      airport.code.toLowerCase().includes(query.toLowerCase()) ||
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const flightApiService = new FlightApiService();

/*
 * NOTE: This is a P0 implementation with Amadeus API integration structure.
 * Currently falls back to mock data when API credentials are not available.
 * 
 * For P1 enhancements:
 * - Add proper error handling and retry logic
 * - Implement caching for repeated searches
 * - Add support for multi-city flights
 * - Integrate with additional flight APIs (Skyscanner, etc.)
 * - Add real-time price tracking
 * - Implement seat selection and booking
 */