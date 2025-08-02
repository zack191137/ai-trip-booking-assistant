import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Button,
  Fab,
  Tab,
  Tabs,
  Container,
} from '@mui/material'
import { Add, Flight } from '@mui/icons-material'
import { TripCard } from '@/components/trip/TripCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useErrorWithNotification } from '@/contexts/ErrorContext'
import { tripService } from '@/services/trip'
import { TripPlan } from '@/types/trip'
import { useNavigate } from 'react-router-dom'

export function TripsPage() {
  const [trips, setTrips] = useState<TripPlan[]>([])
  const [currentTab, setCurrentTab] = useState(0)
  const navigate = useNavigate()
  
  const { executeWithNotification, isLoading, showError } = useErrorWithNotification()

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    const result = await executeWithNotification(
      () => tripService.getTrips(),
      { context: 'Loading trips' }
    )
    
    if (result) {
      setTrips(result)
    }
  }

  const handleSelectTrip = (tripId: string) => {
    navigate(`/trips/${tripId}`)
  }

  const handleEditTrip = (tripId: string) => {
    navigate(`/trips/${tripId}/edit`)
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return
    }

    const result = await executeWithNotification(
      () => tripService.deleteTrip(tripId),
      {
        context: 'Deleting trip',
        successMessage: 'Trip deleted successfully',
      }
    )

    if (result !== null) {
      setTrips(prev => prev.filter(trip => trip.id !== tripId))
    }
  }

  const handleShareTrip = async (tripId: string) => {
    // TODO: Implement trip sharing
    console.log('Share trip:', tripId)
  }

  const handleDownloadTrip = async (tripId: string) => {
    // This will be handled by the PDF export functionality
    navigate(`/trips/${tripId}`)
  }

  const handleNewTrip = () => {
    navigate('/chat')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const activeTrips = trips.filter(trip => trip.status !== 'cancelled')
  const archivedTrips = trips.filter(trip => trip.status === 'cancelled')

  const currentTrips = currentTab === 0 ? activeTrips : archivedTrips

  if (isLoading && trips.length === 0) {
    return <LoadingSpinner message="Loading your trips..." fullScreen />
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Trips
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Plan, book, and manage your travel adventures
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewTrip}
            size="large"
          >
            Plan New Trip
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              label={`Active Trips (${activeTrips.length})`}
              icon={<Flight />}
              iconPosition="start"
            />
            <Tab
              label={`Archived (${archivedTrips.length})`}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Trip Grid */}
        {currentTrips.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              textAlign: 'center',
            }}
          >
            <Flight sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {currentTab === 0 ? 'No active trips yet' : 'No archived trips'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {currentTab === 0
                ? 'Start planning your next adventure by creating a new trip'
                : 'Archived trips will appear here'
              }
            </Typography>
            {currentTab === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleNewTrip}
                size="large"
              >
                Create Your First Trip
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {currentTrips.map((trip) => (
              <Grid item xs={12} sm={6} lg={4} key={trip.id}>
                <TripCard
                  trip={trip}
                  onSelect={handleSelectTrip}
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                  onShare={handleShareTrip}
                  onDownload={handleDownloadTrip}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button for mobile */}
        <Fab
          color="primary"
          aria-label="add trip"
          onClick={handleNewTrip}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <Add />
        </Fab>
      </Box>
    </Container>
  )
}