import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { TripPlan, TripState } from '@/types/trip'
import { tripService } from '@/services/trip'

interface TripContextType extends TripState {
  loadTrips: () => Promise<void>
  loadTrip: (tripId: string) => Promise<void>
  createTrip: (tripData: Partial<TripPlan>) => Promise<TripPlan | null>
  updateTrip: (tripId: string, updates: Partial<TripPlan>) => Promise<TripPlan | null>
  deleteTrip: (tripId: string) => Promise<boolean>
  selectTrip: (trip: TripPlan | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

const TripContext = createContext<TripContextType | undefined>(undefined)

type TripAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRIPS'; payload: TripPlan[] }
  | { type: 'ADD_TRIP'; payload: TripPlan }
  | { type: 'UPDATE_TRIP'; payload: TripPlan }
  | { type: 'REMOVE_TRIP'; payload: string }
  | { type: 'SET_CURRENT_TRIP'; payload: TripPlan | null }

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
}

function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'SET_TRIPS':
      return { ...state, trips: action.payload, isLoading: false, error: null }
    
    case 'ADD_TRIP':
      return {
        ...state,
        trips: [action.payload, ...state.trips],
        isLoading: false,
        error: null,
      }
    
    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map(trip =>
          trip.id === action.payload.id ? action.payload : trip
        ),
        currentTrip:
          state.currentTrip?.id === action.payload.id
            ? action.payload
            : state.currentTrip,
        isLoading: false,
        error: null,
      }
    
    case 'REMOVE_TRIP':
      return {
        ...state,
        trips: state.trips.filter(trip => trip.id !== action.payload),
        currentTrip:
          state.currentTrip?.id === action.payload ? null : state.currentTrip,
        isLoading: false,
        error: null,
      }
    
    case 'SET_CURRENT_TRIP':
      return { ...state, currentTrip: action.payload, isLoading: false, error: null }
    
    default:
      return state
  }
}

interface TripProviderProps {
  children: ReactNode
}

export function TripProvider({ children }: TripProviderProps) {
  const [state, dispatch] = useReducer(tripReducer, initialState)

  const loadTrips = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const trips = await tripService.getTrips()
      dispatch({ type: 'SET_TRIPS', payload: trips })
    } catch (error: unknown) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load trips' })
    }
  }

  const loadTrip = async (tripId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const trip = await tripService.getTrip(tripId)
      dispatch({ type: 'SET_CURRENT_TRIP', payload: trip })
    } catch (error: unknown) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load trip' })
    }
  }

  const createTrip = async (tripData: Partial<TripPlan>): Promise<TripPlan | null> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const trip = await tripService.createTrip(tripData)
      dispatch({ type: 'ADD_TRIP', payload: trip })
      return trip
    } catch (error: unknown) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to create trip' })
      return null
    }
  }

  const updateTrip = async (tripId: string, updates: Partial<TripPlan>): Promise<TripPlan | null> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const trip = await tripService.updateTrip(tripId, updates)
      dispatch({ type: 'UPDATE_TRIP', payload: trip })
      return trip
    } catch (error: unknown) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update trip' })
      return null
    }
  }

  const deleteTrip = async (tripId: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      await tripService.deleteTrip(tripId)
      dispatch({ type: 'REMOVE_TRIP', payload: tripId })
      return true
    } catch (error: unknown) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to delete trip' })
      return false
    }
  }

  const selectTrip = (trip: TripPlan | null) => {
    dispatch({ type: 'SET_CURRENT_TRIP', payload: trip })
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const value: TripContextType = {
    ...state,
    loadTrips,
    loadTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    selectTrip,
    clearError,
    setLoading,
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrip() {
  const context = useContext(TripContext)
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider')
  }
  return context
}

export { TripContext }