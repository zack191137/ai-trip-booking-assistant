import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { TripDetails } from '@/components/trip/TripDetails'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorFallback } from '@/components/common/ErrorFallback'
import { useErrorWithNotification } from '@/contexts/ErrorContext'
import { tripService } from '@/services/trip'
import { TripPlan } from '@/types/trip'

export function TripDetailsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<TripPlan | null>(null)
  const { executeWithNotification, isLoading } = useErrorWithNotification()

  const loadTrip = useCallback(async (id: string) => {
    const result = await executeWithNotification(
      () => tripService.getTrip(id),
      { context: `Loading trip ${id}` }
    )
    
    if (result) {
      setTrip(result)
    }
  }, [executeWithNotification])

  useEffect(() => {
    if (tripId) {
      loadTrip(tripId)
    }
  }, [tripId, loadTrip])

  const handleEditTrip = (tripId: string) => {
    // TODO: Navigate to trip edit page or open edit modal
    console.log('Edit trip:', tripId)
  }

  const handleShareTrip = (tripId: string) => {
    // TODO: Implement trip sharing functionality
    console.log('Share trip:', tripId)
  }

  const handleDownloadTrip = (tripId: string) => {
    // PDF download will be handled by the PDFExportButton in TripDetails
    console.log('Download trip:', tripId)
  }

  const handleBookActivity = async (activityId: string) => {
    // TODO: Implement activity booking
    console.log('Book activity:', activityId)
  }

  if (!tripId) {
    return <Navigate to="/trips" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading trip details..." fullScreen />
  }

  if (!trip) {
    return (
      <ErrorFallback
        message="Trip not found"
        showDetails={false}
      />
    )
  }

  return (
    <TripDetails
      trip={trip}
      onEdit={handleEditTrip}
      onShare={handleShareTrip}
      onDownload={handleDownloadTrip}
      onBookActivity={handleBookActivity}
    />
  )
}