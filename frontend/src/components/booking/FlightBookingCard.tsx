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
  Flight,
  AttachMoney,
  FlightTakeoff,
  FlightLand,
} from '@mui/icons-material'
import type { FlightBooking } from '@/types/trip'
import { format, parseISO } from 'date-fns'

interface FlightBookingCardProps {
  flight: FlightBooking
  onBook?: (flightId: string) => void
  onCancel?: (flightId: string) => void
  onViewDetails?: (flightId: string) => void
}

export function FlightBookingCard({ flight, onBook, onCancel, onViewDetails }: FlightBookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const formatTime = (time: string) => {
    try {
      return format(parseISO(time), 'HH:mm')
    } catch {
      return time
    }
  }

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d')
    } catch {
      return date
    }
  }

  const getFlightTypeColor = (type: string) => {
    return type === 'outbound' ? 'primary' : 'secondary'
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Flight />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {flight.airline} {flight.flightNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {flight.class} • {flight.passengers} passenger{flight.passengers !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={flight.type.charAt(0).toUpperCase() + flight.type.slice(1)}
              color={getFlightTypeColor(flight.type)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
              color={getStatusColor(flight.status)}
              size="small"
            />
          </Box>
        </Box>

        {/* Flight Route */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {/* Departure */}
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <FlightTakeoff sx={{ fontSize: 20 }} />
              {formatTime(flight.departure.time)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(flight.departure.date)}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {flight.from.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {flight.from.city}
            </Typography>
          </Box>

          {/* Flight Duration */}
          <Box sx={{ textAlign: 'center', mx: 2 }}>
            <Box
              sx={{
                height: 2,
                backgroundColor: 'primary.main',
                position: 'relative',
                minWidth: 80,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: -4,
                  top: -4,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid',
                  borderLeftColor: 'primary.main',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {flight.duration}
            </Typography>
          </Box>

          {/* Arrival */}
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <FlightLand sx={{ fontSize: 20 }} />
              {formatTime(flight.arrival.time)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(flight.arrival.date)}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {flight.to.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {flight.to.city}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Price and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="h6">
                {flight.price.currency} {flight.price.amount.toLocaleString()}
              </Typography>
            </Box>
            
            {flight.confirmationCode && (
              <Typography variant="body2" color="text.secondary">
                Confirmation: {flight.confirmationCode}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {onViewDetails && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onViewDetails(flight.id)}
              >
                Details
              </Button>
            )}
            
            {flight.status === 'pending' && onBook && (
              <Button
                variant="contained"
                size="small"
                onClick={() => onBook(flight.id)}
              >
                Confirm Booking
              </Button>
            )}
            
            {(flight.status === 'confirmed' || flight.status === 'pending') && onCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onCancel(flight.id)}
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