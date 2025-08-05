// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    extractedData?: Record<string, unknown>;
  };
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  extractedPreferences: TripPreferences;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

// Trip Preferences (extracted from conversation)
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

// Money type
export interface Money {
  amount: number;
  currency: string;
}

// Airport type
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Flight Details
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

// Hotel Details
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

// Restaurant Details
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

// Day Plan
export interface DayPlan {
  date: Date;
  activities: Activity[];
}

// Activity
export interface Activity {
  time: string;
  type: 'flight' | 'hotel_checkin' | 'hotel_checkout' | 'restaurant' | 'free_time';
  details: FlightDetails | HotelDetails | RestaurantDetails | Record<string, unknown>;
}

// Trip Plan
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