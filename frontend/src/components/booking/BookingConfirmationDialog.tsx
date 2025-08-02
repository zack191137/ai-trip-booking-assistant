import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  CheckCircle,
  AttachMoney,
} from '@mui/icons-material'

interface BookingItem {
  id: string
  name: string
  type: 'flight' | 'hotel' | 'activity'
  price: {
    amount: number
    currency: string
  }
  details: string[]
  cancellationPolicy?: string
}

interface BookingConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  items: BookingItem[]
  isLoading?: boolean
  error?: string | null
}

export function BookingConfirmationDialog({
  open,
  onClose,
  onConfirm,
  items,
  isLoading = false,
  error = null,
}: BookingConfirmationDialogProps) {
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [acceptCancellation, setAcceptCancellation] = React.useState(false)

  const totalAmount = items.reduce((sum, item) => sum + item.price.amount, 0)
  const currency = items[0]?.price.currency || 'USD'

  const handleConfirm = () => {
    if (acceptTerms && acceptCancellation) {
      onConfirm()
    }
  }

  const canConfirm = acceptTerms && acceptCancellation && !isLoading

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️'
      case 'hotel': return '🏨'
      case 'activity': return '🎯'
      default: return '📋'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="primary" />
          <Typography variant="h6">
            Confirm Your Booking
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please review your booking details before confirming. Once confirmed, cancellation policies will apply.
        </Typography>

        {/* Booking Items */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Booking Summary
          </Typography>
          
          {items.map((item) => (
            <Box key={item.id} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{getItemIcon(item.type)}</span>
                    {item.name}
                  </Typography>
                  
                  <List dense sx={{ mt: 1 }}>
                    {item.details.map((detail, detailIndex) => (
                      <ListItem key={detailIndex} sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary={detail}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {item.cancellationPolicy && (
                    <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                      <Typography variant="caption">
                        <strong>Cancellation Policy:</strong> {item.cancellationPolicy}
                      </Typography>
                    </Alert>
                  )}
                </Box>
                
                <Box sx={{ textAlign: 'right', ml: 2 }}>
                  <Typography variant="h6">
                    {item.price.currency} {item.price.amount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Total Amount
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney />
            <Typography variant="h5" color="primary">
              {currency} {totalAmount.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Terms and Conditions */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Button variant="text" size="small" sx={{ p: 0, minWidth: 'auto' }}>
                  Terms and Conditions
                </Button>
                {' '}and{' '}
                <Button variant="text" size="small" sx={{ p: 0, minWidth: 'auto' }}>
                  Privacy Policy
                </Button>
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptCancellation}
                onChange={(e) => setAcceptCancellation(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I understand and accept the cancellation policies for all bookings
              </Typography>
            }
          />
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Bookings are subject to availability and confirmation from service providers. 
            You will receive a confirmation email once all bookings are processed.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!canConfirm}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Processing...' : `Confirm Booking`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}