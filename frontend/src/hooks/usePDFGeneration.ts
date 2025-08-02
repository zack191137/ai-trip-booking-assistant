import { useState } from 'react'
import { TripPlan } from '@/types/trip'
import { PDFGenerator } from '@/utils/pdfGenerator'
import { tripService } from '@/services/trip'

export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateItineraryPDF = async (trip: TripPlan, download: boolean = true) => {
    setIsGenerating(true)
    setError(null)

    try {
      const generator = new PDFGenerator()
      const blob = generator.generateTripItinerary(trip)
      
      if (download) {
        const filename = `${trip.title.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`
        PDFGenerator.downloadPDF(blob, filename)
      }
      
      return blob
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateBookingPDF = async (trip: TripPlan, download: boolean = true) => {
    setIsGenerating(true)
    setError(null)

    try {
      const generator = new PDFGenerator()
      const blob = generator.generateBookingConfirmation(trip)
      
      if (download) {
        const filename = `${trip.title.replace(/[^a-zA-Z0-9]/g, '_')}_Booking_Confirmation.pdf`
        PDFGenerator.downloadPDF(blob, filename)
      }
      
      return blob
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateServerPDF = async (tripId: string, type: 'itinerary' | 'booking', download: boolean = true) => {
    setIsGenerating(true)
    setError(null)

    try {
      const blob = await tripService.generatePDF(tripId, type)
      
      if (download) {
        const filename = `Trip_${type.charAt(0).toUpperCase() + type.slice(1)}_${tripId}.pdf`
        PDFGenerator.downloadPDF(blob, filename)
      }
      
      return blob
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate PDF'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportTrip = async (tripId: string, format: 'pdf' | 'json', download: boolean = true) => {
    setIsGenerating(true)
    setError(null)

    try {
      const blob = await tripService.exportTrip(tripId, format)
      
      if (download) {
        const extension = format === 'pdf' ? 'pdf' : 'json'
        const filename = `Trip_Export_${tripId}.${extension}`
        PDFGenerator.downloadPDF(blob, filename)
      }
      
      return blob
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export trip'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    isGenerating,
    error,
    generateItineraryPDF,
    generateBookingPDF,
    generateServerPDF,
    exportTrip,
    clearError,
  }
}