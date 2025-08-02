import React from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Avatar,
  Rating,
} from '@mui/material'
import {
  Hotel,
  CalendarToday,
  Person,
  AttachMoney,
  Bed,
  Wifi,
  Restaurant,
  Pool,
  FitnessCenter,
} from '@mui/icons-material'
import { HotelBooking } from '@/types/trip'
import { format, parseISO } from 'date-fns'

interface HotelBookingCardProps {
  hotel: HotelBooking
  onBook?: (hotelId: string) => void
  onCancel?: (hotelId: string) => void
  onViewDetails?: (hotelId: string) => void
}

export function HotelBookingCard({ hotel, onBook, onCancel, onViewDetails }: HotelBookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'free wifi':
        return <Wifi sx={{ fontSize: 16 }} />
      case 'restaurant':
      case 'dining':
        return <Restaurant sx={{ fontSize: 16 }} />
      case 'pool':
      case 'swimming pool':
        return <Pool sx={{ fontSize: 16 }} />
      case 'gym':
      case 'fitness center':
        return <FitnessCenter sx={{ fontSize: 16 }} />
      default:
        return null
    }
  }

  // Use placeholder image for now
  const imageUrl = hotel.images?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop&crop=entropy&auto=format&q=80`

  return (
    <Card sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Hotel Image */}
        <CardMedia
          component="img"
          sx={{
            width: { xs: '100%', md: 200 },
            height: { xs: 200, md: 'auto' },
            objectFit: 'cover',
          }}
          image={imageUrl}
          alt={hotel.name}
        />

        <CardContent sx={{ flex: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {hotel.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {hotel.address}
              </Typography>
              
              {hotel.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={hotel.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {hotel.rating}/5
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Chip
              label={hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
              color={getStatusColor(hotel.status)}
              size="small"
            />
          </Box>

          {/* Booking Details */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(hotel.checkIn)} - {formatDate(hotel.checkOut)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bed sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {hotel.nights} night{hotel.nights !== 1 ? 's' : ''} • {hotel.roomType}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {hotel.guests} guest{hotel.guests !== 1 ? 's' : ''} • {hotel.rooms} room{hotel.rooms !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {hotel.amenities.slice(0, 4).map((amenity) => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    size="small"
                    variant="outlined"
                    icon={getAmenityIcon(amenity)}
                  />
                ))}
                {hotel.amenities.length > 4 && (
                  <Chip
                    label={`+${hotel.amenities.length - 4} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Price and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="h6">
                  {hotel.price.currency} {hotel.price.amount.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  total
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {hotel.price.currency} {hotel.price.perNight.toLocaleString()} per night
              </Typography>
              
              {hotel.confirmationCode && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Confirmation: {hotel.confirmationCode}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {onViewDetails && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onViewDetails(hotel.id)}
                >
                  Details
                </Button>
              )}
              
              {hotel.status === 'pending' && onBook && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onBook(hotel.id)}
                >
                  Confirm Booking
                </Button>
              )}
              
              {(hotel.status === 'confirmed' || hotel.status === 'pending') && onCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => onCancel(hotel.id)}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Card>
  )
}