import React, { useState } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Download,
  PictureAsPdf,
  Description,
  BookOnline,
  DataObject,
} from '@mui/icons-material'
import { TripPlan } from '@/types/trip'
import { usePDFGeneration } from '@/hooks/usePDFGeneration'

interface PDFExportButtonProps {
  trip: TripPlan
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

export function PDFExportButton({ trip, variant = 'outlined', size = 'medium', disabled = false }: PDFExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const {
    isGenerating,
    error,
    generateItineraryPDF,
    generateBookingPDF,
    generateServerPDF,
    exportTrip,
    clearError,
  } = usePDFGeneration()

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExport = async (type: 'itinerary' | 'booking' | 'server-itinerary' | 'server-booking' | 'json') => {
    handleMenuClose()
    clearError()

    try {
      switch (type) {
        case 'itinerary':
          await generateItineraryPDF(trip)
          setSuccessMessage('Itinerary PDF downloaded successfully!')
          break
        case 'booking':
          await generateBookingPDF(trip)
          setSuccessMessage('Booking confirmation PDF downloaded successfully!')
          break
        case 'server-itinerary':
          await generateServerPDF(trip.id, 'itinerary')
          setSuccessMessage('Server-generated itinerary PDF downloaded successfully!')
          break
        case 'server-booking':
          await generateServerPDF(trip.id, 'booking')
          setSuccessMessage('Server-generated booking PDF downloaded successfully!')
          break
        case 'json':
          await exportTrip(trip.id, 'json')
          setSuccessMessage('Trip data exported as JSON successfully!')
          break
      }
    } catch {
      // Error is handled by the hook
    }
  }

  const handleSnackbarClose = () => {
    setSuccessMessage(null)
    clearError()
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={isGenerating ? <CircularProgress size={16} /> : <Download />}
        onClick={handleMenuOpen}
        disabled={disabled || isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Export'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport('itinerary')}>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Trip Itinerary (PDF)" />
        </MenuItem>

        <MenuItem onClick={() => handleExport('booking')}>
          <ListItemIcon>
            <BookOnline fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Booking Confirmation (PDF)" />
        </MenuItem>

        <MenuItem onClick={() => handleExport('server-itinerary')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Server Itinerary (PDF)" />
        </MenuItem>

        <MenuItem onClick={() => handleExport('server-booking')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Server Booking (PDF)" />
        </MenuItem>

        <MenuItem onClick={() => handleExport('json')}>
          <ListItemIcon>
            <DataObject fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Trip Data (JSON)" />
        </MenuItem>
      </Menu>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={Boolean(successMessage || error)}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {successMessage ? (
          <Alert severity="success" onClose={handleSnackbarClose}>
            {successMessage}
          </Alert>
        ) : error ? (
          <Alert severity="error" onClose={handleSnackbarClose}>
            {error}
          </Alert>
        ) : null}
      </Snackbar>
    </>
  )
}