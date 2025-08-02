import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Avatar,
} from '@mui/material'
import {
  Attractions,
  Schedule,
  Person,
  AttachMoney,
  LocationOn,
  AccessTime,
} from '@mui/icons-material'
import type { ActivityBooking } from '@/types/trip'
import { format, parseISO } from 'date-fns'

interface ActivityBookingCardProps {
  activity: ActivityBooking
  onBook?: (activityId: string) => void
  onCancel?: (activityId: string) => void
  onViewDetails?: (activityId: string) => void
}

export function ActivityBookingCard({ activity, onBook, onCancel, onViewDetails }: ActivityBookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tour': return 'primary'
      case 'activity': return 'secondary'
      case 'experience': return 'success'
      case 'excursion': return 'info'
      default: return 'default'
    }
  }

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatTime = (time: string) => {
    try {
      return format(parseISO(time), 'HH:mm')
    } catch {
      return time
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) {
      return `${duration} min`
    } else if (duration < 1440) {
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    } else {
      const days = Math.floor(duration / 1440)
      return `${days} day${days !== 1 ? 's' : ''}`
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <Attractions />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {activity.name}
              </Typography>
              {activity.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {activity.description}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              color={getActivityTypeColor(activity.type)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              color={getStatusColor(activity.status)}
              size="small"
            />
          </Box>
        </Box>

        {/* Activity Details */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(activity.date)} at {formatTime(activity.time)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Duration: {formatDuration(activity.duration)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {activity.location}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {activity.participants} participant{activity.participants !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Price and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="h6">
                {activity.price.currency} {activity.price.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                total
              </Typography>
            </Box>
            
            {activity.confirmationCode && (
              <Typography variant="body2" color="text.secondary">
                Confirmation: {activity.confirmationCode}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {onViewDetails && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onViewDetails(activity.id)}
              >
                Details
              </Button>
            )}
            
            {activity.status === 'pending' && onBook && (
              <Button
                variant="contained"
                size="small"
                onClick={() => onBook(activity.id)}
              >
                Confirm Booking
              </Button>
            )}
            
            {(activity.status === 'confirmed' || activity.status === 'pending') && onCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onCancel(activity.id)}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}