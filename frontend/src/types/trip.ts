export interface TripPlan {
  id: string
  userId: string
  conversationId: string
  title: string
  description: string
  destination: {
    city: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  dates: {
    startDate: string
    endDate: string
    duration: number
  }
  budget: {
    total: number
    currency: string
    breakdown: {
      flights: number
      accommodation: number
      activities: number
      food: number
      transportation: number
      other: number
    }
  }
  travelers: {
    adults: number
    children: number
  }
  preferences: {
    travelStyle: string[]
    interests: string[]
    dietary: string[]
    accessibility: string[]
  }
  itinerary: Activity[]
  bookings: {
    flights: FlightBooking[]
    hotels: HotelBooking[]
    activities: ActivityBooking[]
  }
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  day: number
  time: string
  name: string
  type: 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'transportation' | 'other'
  description: string
  location: {
    name: string
    address: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  duration: number
  price: {
    amount: number
    currency: string
  }
  booking?: {
    id: string
    status: 'pending' | 'confirmed' | 'cancelled'
    confirmationCode?: string
  }
  images?: string[]
  rating?: number
  reviews?: number
}

export interface FlightBooking {
  id: string
  type: 'outbound' | 'return'
  airline: string
  flightNumber: string
  from: {
    airport: string
    city: string
    code: string
  }
  to: {
    airport: string
    city: string
    code: string
  }
  departure: {
    date: string
    time: string
  }
  arrival: {
    date: string
    time: string
  }
  duration: string
  class: string
  passengers: number
  price: {
    amount: number
    currency: string
  }
  status: 'pending' | 'confirmed' | 'cancelled'
  confirmationCode?: string
}

export interface HotelBooking {
  id: string
  name: string
  address: string
  checkIn: string
  checkOut: string
  nights: number
  rooms: number
  guests: number
  roomType: string
  amenities: string[]
  price: {
    amount: number
    currency: string
    perNight: number
  }
  status: 'pending' | 'confirmed' | 'cancelled'
  confirmationCode?: string
  rating?: number
  images?: string[]
}

export interface ActivityBooking {
  id: string
  name: string
  type: string
  date: string
  time: string
  duration: number
  location: string
  participants: number
  price: {
    amount: number
    currency: string
  }
  status: 'pending' | 'confirmed' | 'cancelled'
  confirmationCode?: string
  description?: string
}

export interface TripState {
  trips: TripPlan[]
  currentTrip: TripPlan | null
  isLoading: boolean
  error: string | null
}