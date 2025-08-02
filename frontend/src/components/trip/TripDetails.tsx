import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Tab,
  Tabs,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  LinearProgress,
} from '@mui/material'
import {
  LocationOn,
  CalendarToday,
  AttachMoney,
  People,
  Flight,
  Hotel,
  Restaurant,
  Edit,
  Share,
  Download,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material'
import { TripPlan } from '@/types/trip'
import { ItineraryView } from './ItineraryView'
import { format, differenceInDays } from 'date-fns'

interface TripDetailsProps {
  trip: TripPlan
  onEdit?: (tripId: string) => void
  onShare?: (tripId: string) => void
  onDownload?: (tripId: string) => void
  onBookActivity?: (activityId: string) => void
}

export function TripDetails({ trip, onEdit, onShare, onDownload, onBookActivity }: TripDetailsProps) {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'confirmed': return 'success'
      case 'completed': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getTripProgress = () => {
    const totalBookings = trip.bookings.flights.length + trip.bookings.hotels.length + trip.bookings.activities.length
    const confirmedBookings = [
      ...trip.bookings.flights,
      ...trip.bookings.hotels,
      ...trip.bookings.activities,
    ].filter(booking => booking.status === 'confirmed').length

    return totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
  }

  const formatDateRange = () => {
    const start = format(new Date(trip.dates.startDate), 'MMMM d, yyyy')
    const end = format(new Date(trip.dates.endDate), 'MMMM d, yyyy')
    return `${start} - ${end}`
  }

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Trip Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {trip.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {trip.description}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                color={getStatusColor(trip.status)}
                variant="outlined"
              />
              
              <Button startIcon={<Edit />} onClick={() => onEdit?.(trip.id)}>
                Edit
              </Button>
              <Button startIcon={<Share />} onClick={() => onShare?.(trip.id)}>
                Share
              </Button>
              <Button startIcon={<Download />} onClick={() => onDownload?.(trip.id)}>
                Download
              </Button>
            </Box>
          </Box>

          {/* Trip Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary="Destination"
                    secondary={`${trip.destination.city}, ${trip.destination.country}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dates"
                    secondary={`${formatDateRange()} (${trip.dates.duration} days)`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText
                    primary="Travelers"
                    secondary={`${trip.travelers.adults} adult${trip.travelers.adults !== 1 ? 's' : ''}${trip.travelers.children > 0 ? `, ${trip.travelers.children} child${trip.travelers.children !== 1 ? 'ren' : ''}` : ''}`}
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Budget"
                    secondary={`${trip.budget.currency} ${trip.budget.total.toLocaleString()}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Flight />
                  </ListItemIcon>
                  <ListItemText
                    primary="Flights"
                    secondary={`${trip.bookings.flights.length} booking${trip.bookings.flights.length !== 1 ? 's' : ''}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Hotel />
                  </ListItemIcon>
                  <ListItemText
                    primary="Hotels"
                    secondary={`${trip.bookings.hotels.length} booking${trip.bookings.hotels.length !== 1 ? 's' : ''}`}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          {/* Booking Progress */}
          {trip.status !== 'draft' && getTripProgress() > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Booking Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(getTripProgress())}% Complete
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={getTripProgress()} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Itinerary" />
            <Tab label="Bookings" />
            <Tab label="Budget" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>

        {/* Itinerary Tab */}
        <TabPanel value={currentTab} index={0}>
          <ItineraryView trip={trip} onBookActivity={onBookActivity} />
        </TabPanel>

        {/* Bookings Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bookings Overview
            </Typography>
            
            {/* Flight Bookings */}
            {trip.bookings.flights.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Flight /> Flights ({trip.bookings.flights.length})
                </Typography>
                {trip.bookings.flights.map((flight) => (
                  <Card key={flight.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {flight.airline} {flight.flightNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {flight.from.city} → {flight.to.city} • {flight.departure.date}
                          </Typography>
                        </Box>
                        <Chip
                          label={flight.status}
                          color={flight.status === 'confirmed' ? 'success' : flight.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Hotel Bookings */}
            {trip.bookings.hotels.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Hotel /> Hotels ({trip.bookings.hotels.length})
                </Typography>
                {trip.bookings.hotels.map((hotel) => (
                  <Card key={hotel.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {hotel.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {hotel.checkIn} - {hotel.checkOut} • {hotel.nights} nights
                          </Typography>
                        </Box>
                        <Chip
                          label={hotel.status}
                          color={hotel.status === 'confirmed' ? 'success' : hotel.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {trip.bookings.flights.length === 0 && trip.bookings.hotels.length === 0 && trip.bookings.activities.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No bookings yet. Start by booking your flights and hotels.
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* Budget Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget Breakdown
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Flights"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.flights.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Accommodation"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.accommodation.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Activities"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.activities.toLocaleString()}`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Food & Dining"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.food.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Transportation"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.transportation.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Other"
                      secondary={`${trip.budget.currency} ${trip.budget.breakdown.other.toLocaleString()}`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6">
              Total: {trip.budget.currency} {trip.budget.total.toLocaleString()}
            </Typography>
          </Box>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={currentTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Travel Preferences
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Travel Style
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {trip.preferences.travelStyle.map((style) => (
                    <Chip key={style} label={style} size="small" variant="outlined" />
                  ))}
                  {trip.preferences.travelStyle.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No travel style preferences specified
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Interests
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {trip.preferences.interests.map((interest) => (
                    <Chip key={interest} label={interest} size="small" variant="outlined" />
                  ))}
                  {trip.preferences.interests.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No interests specified
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Dietary Requirements
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {trip.preferences.dietary.map((dietary) => (
                    <Chip key={dietary} label={dietary} size="small" variant="outlined" />
                  ))}
                  {trip.preferences.dietary.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No dietary requirements specified
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Accessibility Needs
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {trip.preferences.accessibility.map((accessibility) => (
                    <Chip key={accessibility} label={accessibility} size="small" variant="outlined" />
                  ))}
                  {trip.preferences.accessibility.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No accessibility needs specified
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  )
}