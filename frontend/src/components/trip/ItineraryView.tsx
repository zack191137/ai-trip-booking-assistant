import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Chip,
  IconButton,
  Collapse,
  Rating,
  Button,
} from '@mui/material'
import {
  Flight,
  Hotel,
  Restaurant,
  Attractions,
  DirectionsCar,
  Schedule,
  LocationOn,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  BookOnline,
} from '@mui/icons-material'
import { Activity, TripPlan } from '@/types/trip'
import { format } from 'date-fns'

interface ItineraryViewProps {
  trip: TripPlan
  onBookActivity?: (activityId: string) => void
}

export function ItineraryView({ trip, onBookActivity }: ItineraryViewProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Flight />
      case 'hotel': return <Hotel />
      case 'restaurant': return <Restaurant />
      case 'attraction': return <Attractions />
      case 'transportation': return <DirectionsCar />
      default: return <Schedule />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'flight': return 'primary'
      case 'hotel': return 'secondary'
      case 'restaurant': return 'warning'
      case 'attraction': return 'success'
      case 'transportation': return 'info'
      default: return 'default'
    }
  }

  const groupActivitiesByDay = () => {
    const grouped: { [key: number]: Activity[] } = {}
    
    trip.itinerary.forEach(activity => {
      if (!grouped[activity.day]) {
        grouped[activity.day] = []
      }
      grouped[activity.day].push(activity)
    })

    // Sort activities within each day by time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.time.localeCompare(b.time))
    })

    return grouped
  }

  const getDayDate = (dayNumber: number) => {
    const startDate = new Date(trip.dates.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + dayNumber - 1)
    return dayDate
  }

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day)
  }

  const groupedActivities = groupActivitiesByDay()
  const days = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b)

  if (trip.itinerary.length === 0) {
    return (
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
        <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No itinerary available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The itinerary will appear here once it's generated
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Itinerary
      </Typography>

      {days.map((day) => (
        <Card key={day} sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            {/* Day Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                py: 1,
              }}
              onClick={() => toggleDay(day)}
            >
              <Box>
                <Typography variant="h6">
                  Day {day}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(getDayDate(day), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${groupedActivities[day].length} activities`}
                  size="small"
                  variant="outlined"
                />
                <IconButton>
                  {expandedDay === day ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </Box>

            {/* Day Activities */}
            <Collapse in={expandedDay === day} timeout="auto" unmountOnExit>
              <Timeline sx={{ mt: 2 }}>
                {groupedActivities[day].map((activity, index) => (
                  <TimelineItem key={activity.id}>
                    <TimelineSeparator>
                      <TimelineDot color={getActivityColor(activity.type)}>
                        {getActivityIcon(activity.type)}
                      </TimelineDot>
                      {index < groupedActivities[day].length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent sx={{ pb: 3 }}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        {/* Activity Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {activity.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.time} • {activity.duration} hours
                            </Typography>
                          </Box>
                          
                          <Chip
                            label={activity.type}
                            color={getActivityColor(activity.type)}
                            size="small"
                          />
                        </Box>

                        {/* Activity Details */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" paragraph>
                            {activity.description}
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {activity.location.name}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {activity.price.currency} {activity.price.amount}
                              </Typography>
                            </Box>

                            {activity.rating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Rating value={activity.rating} readOnly size="small" />
                                <Typography variant="body2" color="text.secondary">
                                  {activity.rating}/5 ({activity.reviews} reviews)
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {/* Booking Status & Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            {activity.booking ? (
                              <Chip
                                label={`${activity.booking.status} ${activity.booking.confirmationCode ? `• ${activity.booking.confirmationCode}` : ''}`}
                                color={activity.booking.status === 'confirmed' ? 'success' : activity.booking.status === 'pending' ? 'warning' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="Not booked"
                                color="default"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          {!activity.booking && onBookActivity && (
                            <Button
                              startIcon={<BookOnline />}
                              variant="outlined"
                              size="small"
                              onClick={() => onBookActivity(activity.id)}
                            >
                              Book Now
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}