export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional for type safety, but stored in P0
  preferences?: UserPreferences;
  paymentMethods?: PaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  currency?: string;
  language?: string;
  notifications?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  extractedPreferences: TripPreferences;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    extractedData?: any;
    type?: string;
  };
}

export interface TripPreferences {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  flightPreferences?: {
    class: 'economy' | 'business' | 'first';
    directOnly?: boolean;
    airlines?: string[];
  };
  hotelPreferences?: {
    stars?: number;
    amenities?: string[];
    location?: string;
  };
  restaurantPreferences?: {
    cuisines?: string[];
    dietary?: string[];
    priceRange?: string;
  };
}

export interface TripPlan {
  id: string;
  userId: string;
  conversationId: string;
  status: 'draft' | 'confirmed' | 'booked';
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  flights: FlightDetails[];
  hotels: HotelDetails[];
  restaurants: RestaurantDetails[];
  totalEstimatedCost: Money;
  itinerary: DayPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: Airport;
  arrival: Airport;
  departureTime: Date;
  arrivalTime: Date;
  price: Money;
  class: string;
  bookingUrl?: string;
  bookingId?: string;
}

export interface HotelDetails {
  name: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  price: Money;
  amenities: string[];
  rating: number;
  bookingUrl?: string;
  bookingId?: string;
}

export interface RestaurantDetails {
  name: string;
  address: string;
  reservationTime: Date;
  cuisine: string;
  priceRange: string;
  rating: number;
  bookingUrl?: string;
  reservationId?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface DayPlan {
  date: Date;
  activities: Activity[];
}

export interface Activity {
  name: string;
  time: string;
  type: 'flight' | 'hotel_checkin' | 'hotel_checkout' | 'restaurant' | 'free_time';
  description?: string;
  estimatedCost?: Money;
  details: any;
}

// TripItinerary is just an alias for TripPlan for PDF generation
export type TripItinerary = TripPlan;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}