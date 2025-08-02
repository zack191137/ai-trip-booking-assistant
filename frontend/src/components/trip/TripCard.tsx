import React from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
} from '@mui/material'
import {
  MoreVert,
  Flight,
  Hotel,
  CalendarToday,
  AttachMoney,
  People,
  Edit,
  Delete,
  Share,
  Download,
} from '@mui/icons-material'
import { TripPlan } from '@/types/trip'
import { format } from 'date-fns'

interface TripCardProps {
  trip: TripPlan
  onSelect: (tripId: string) => void
  onEdit?: (tripId: string) => void
  onDelete?: (tripId: string) => void
  onShare?: (tripId: string) => void
  onDownload?: (tripId: string) => void
}

export function TripCard({ trip, onSelect, onEdit, onDelete, onShare, onDownload }: TripCardProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    onEdit?.(trip.id)
    handleMenuClose()
  }

  const handleDelete = () => {
    onDelete?.(trip.id)
    handleMenuClose()
  }

  const handleShare = () => {
    onShare?.(trip.id)
    handleMenuClose()
  }

  const handleDownload = () => {
    onDownload?.(trip.id)
    handleMenuClose()
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'confirmed': return 'Confirmed'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const formatDateRange = () => {
    const start = format(new Date(trip.dates.startDate), 'MMM d')
    const end = format(new Date(trip.dates.endDate), 'MMM d, yyyy')
    return `${start} - ${end}`
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

  // Use placeholder image for now
  const imageUrl = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop&crop=entropy&auto=format&q=80`

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onSelect(trip.id)}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={trip.destination.city}
        sx={{
          objectFit: 'cover',
        }}
      />
      
      <CardContent sx={{ pb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {trip.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={getStatusLabel(trip.status)}
              color={getStatusColor(trip.status)}
              size="small"
            />
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Destination */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {trip.destination.city}, {trip.destination.country}
        </Typography>

        {/* Trip Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDateRange()} ({trip.dates.duration} days)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {trip.travelers.adults} adult{trip.travelers.adults !== 1 ? 's' : ''}
              {trip.travelers.children > 0 && `, ${trip.travelers.children} child${trip.travelers.children !== 1 ? 'ren' : ''}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {trip.budget.currency} {trip.budget.total.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Booking Progress */}
        {trip.status !== 'draft' && getTripProgress() > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Booking Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(getTripProgress())}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={getTripProgress()} />
          </Box>
        )}

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Flight sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption">
                {trip.bookings.flights.length}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hotel sx={{ fontSize: 16, color: 'secondary.main' }} />
              <Typography variant="caption">
                {trip.bookings.hotels.length}
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {format(new Date(trip.updatedAt), 'MMM d')}
          </Typography>
        </Box>
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 2 }} />
            Edit Trip
          </MenuItem>
        )}
        
        {onShare && (
          <MenuItem onClick={handleShare}>
            <Share sx={{ mr: 2 }} />
            Share Trip
          </MenuItem>
        )}
        
        {onDownload && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 2 }} />
            Download PDF
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 2 }} />
            Delete Trip
          </MenuItem>
        )}
      </Menu>
    </Card>
  )
}