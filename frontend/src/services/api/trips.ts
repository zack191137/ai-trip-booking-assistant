import axios from 'axios';
import type { TripPlan, TripPreferences } from '@/types';

// Raw API response types (with string dates)
interface RawTripPlan {
  id: string;
  userId: string;
  conversationId: string;
  status: 'draft' | 'confirmed' | 'booked';
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  flights: RawFlightDetails[];
  hotels: RawHotelDetails[];
  restaurants: RawRestaurantDetails[];
  totalEstimatedCost: { amount: number; currency: string };
  itinerary: RawDayPlan[];
  createdAt: string;
  updatedAt: string;
}

interface RawFlightDetails {
  airline: string;
  flightNumber: string;
  departure: { code: string; name: string; city: string; country: string };
  arrival: { code: string; name: string; city: string; country: string };
  departureTime: string;
  arrivalTime: string;
  price: { amount: number; currency: string };
  class: string;
  bookingUrl?: string;
  bookingId?: string;
}

interface RawHotelDetails {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  price: { amount: number; currency: string };
  amenities: string[];
  rating: number;
  bookingUrl?: string;
  bookingId?: string;
}

interface RawRestaurantDetails {
  name: string;
  address: string;
  reservationTime: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  bookingUrl?: string;
  reservationId?: string;
}

interface RawDayPlan {
  date: string;
  activities: unknown[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface GetTripsResponse {
  success: boolean;
  data: TripPlan[];
}

export interface GetTripResponse {
  success: boolean;
  data: TripPlan;
}

export interface GenerateTripRequest {
  conversationId: string;
  preferences?: TripPreferences;
}

export interface GenerateTripResponse {
  success: boolean;
  data: TripPlan;
}

export interface UpdateTripRequest {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  preferences?: TripPreferences;
}

export interface UpdateTripResponse {
  success: boolean;
  data: TripPlan;
}

export interface ConfirmTripResponse {
  success: boolean;
  data: TripPlan;
}

class TripsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private convertTripDates(trip: RawTripPlan): TripPlan {
    return {
      ...trip,
      startDate: new Date(trip.startDate),
      endDate: new Date(trip.endDate),
      createdAt: new Date(trip.createdAt),
      updatedAt: new Date(trip.updatedAt),
      flights: trip.flights.map((flight: RawFlightDetails) => ({
        ...flight,
        departureTime: new Date(flight.departureTime),
        arrivalTime: new Date(flight.arrivalTime),
      })),
      hotels: trip.hotels.map((hotel: RawHotelDetails) => ({
        ...hotel,
        checkIn: new Date(hotel.checkIn),
        checkOut: new Date(hotel.checkOut),
      })),
      restaurants: trip.restaurants.map((restaurant: RawRestaurantDetails) => ({
        ...restaurant,
        reservationTime: new Date(restaurant.reservationTime),
      })),
      itinerary: trip.itinerary.map((day: RawDayPlan) => ({
        ...day,
        date: new Date(day.date),
      })),
    };
  }

  /**
   * Get all trips for the current user
   */
  async getTrips(): Promise<TripPlan[]> {
    const response = await axios.get<GetTripsResponse>(
      `${API_BASE_URL}/trips`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch trips');
    }

    return response.data.data.map(trip => this.convertTripDates(trip));
  }

  /**
   * Generate a new trip from a conversation
   */
  async generateTrip(conversationId: string, preferences?: TripPreferences): Promise<TripPlan> {
    const requestData: GenerateTripRequest = {
      conversationId,
      ...(preferences && { preferences }),
    };

    const response = await axios.post<GenerateTripResponse>(
      `${API_BASE_URL}/trips/generate`,
      requestData,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to generate trip');
    }

    return this.convertTripDates(response.data.data);
  }

  /**
   * Get a specific trip by ID
   */
  async getTrip(tripId: string): Promise<TripPlan> {
    const response = await axios.get<GetTripResponse>(
      `${API_BASE_URL}/trips/${tripId}`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch trip');
    }

    return this.convertTripDates(response.data.data);
  }

  /**
   * Update a trip
   */
  async updateTrip(tripId: string, updates: UpdateTripRequest): Promise<TripPlan> {
    const response = await axios.put<UpdateTripResponse>(
      `${API_BASE_URL}/trips/${tripId}`,
      updates,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to update trip');
    }

    return this.convertTripDates(response.data.data);
  }

  /**
   * Confirm a trip plan
   */
  async confirmTrip(tripId: string): Promise<TripPlan> {
    const response = await axios.post<ConfirmTripResponse>(
      `${API_BASE_URL}/trips/${tripId}/confirm`,
      {},
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to confirm trip');
    }

    return this.convertTripDates(response.data.data);
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string): Promise<void> {
    const response = await axios.delete(
      `${API_BASE_URL}/trips/${tripId}`,
      { headers: this.getAuthHeaders() }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error('Failed to delete trip');
    }
  }

  /**
   * Export trip to PDF (Standard)
   */
  async exportTripToPDF(tripId: string): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/trips/${tripId}/pdf`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Export trip to PDF (Minimal)
   */
  async exportTripToPDFMinimal(tripId: string): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/trips/${tripId}/pdf/minimal`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Export trip to PDF (Detailed)
   */
  async exportTripToPDFDetailed(tripId: string): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/trips/${tripId}/pdf/detailed`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Export flight ticket to PDF
   */
  async exportFlightToPDF(tripId: string, flightIndex: number): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/trips/${tripId}/flights/${flightIndex}/pdf`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Export hotel voucher to PDF
   */
  async exportHotelToPDF(tripId: string, hotelIndex: number): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/trips/${tripId}/hotels/${hotelIndex}/pdf`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Helper function to download PDF blob
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const tripsService = new TripsService();
export default tripsService;