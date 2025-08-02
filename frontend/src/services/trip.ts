import axios from 'axios'
import { TripPlan } from '@/types/trip'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const tripApi = axios.create({
  baseURL: `${API_BASE_URL}/trips`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const tripService = {
  async getTrips(): Promise<TripPlan[]> {
    const response = await tripApi.get('/')
    return response.data.trips
  },

  async getTrip(id: string): Promise<TripPlan> {
    const response = await tripApi.get(`/${id}`)
    return response.data.trip
  },

  async createTrip(tripData: Partial<TripPlan>): Promise<TripPlan> {
    const response = await tripApi.post('/', tripData)
    return response.data.trip
  },

  async updateTrip(id: string, updates: Partial<TripPlan>): Promise<TripPlan> {
    const response = await tripApi.put(`/${id}`, updates)
    return response.data.trip
  },

  async deleteTrip(id: string): Promise<void> {
    await tripApi.delete(`/${id}`)
  },

  async generateItinerary(tripId: string, preferences?: unknown): Promise<TripPlan> {
    const response = await tripApi.post(`/${tripId}/generate-itinerary`, { preferences })
    return response.data.trip
  },

  async bookFlight(tripId: string, flightData: unknown): Promise<unknown> {
    const response = await tripApi.post(`/${tripId}/book-flight`, flightData)
    return response.data.booking
  },

  async bookHotel(tripId: string, hotelData: unknown): Promise<unknown> {
    const response = await tripApi.post(`/${tripId}/book-hotel`, hotelData)
    return response.data.booking
  },

  async bookActivity(tripId: string, activityData: unknown): Promise<unknown> {
    const response = await tripApi.post(`/${tripId}/book-activity`, activityData)
    return response.data.booking
  },

  async generatePDF(tripId: string, type: 'itinerary' | 'booking'): Promise<Blob> {
    const response = await tripApi.get(`/${tripId}/pdf/${type}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async exportTrip(tripId: string, format: 'pdf' | 'json'): Promise<Blob> {
    const response = await tripApi.get(`/${tripId}/export/${format}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default tripService