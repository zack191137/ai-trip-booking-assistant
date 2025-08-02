import React from 'react'
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material'

interface LoadingSkeletonProps {
  variant?: 'trip-card' | 'trip-list' | 'chat-message' | 'itinerary' | 'booking-card' | 'custom'
  count?: number
  height?: number | string
  width?: number | string
  animation?: 'pulse' | 'wave' | false
}

export function LoadingSkeleton({
  variant = 'custom',
  count = 1,
  height = 60,
  width = '100%',
  animation = 'wave',
}: LoadingSkeletonProps) {
  const renderTripCard = () => (
    <Card>
      <Skeleton variant="rectangular" height={200} animation={animation} />
      <CardContent>
        <Skeleton variant="text" height={32} width="80%" animation={animation} />
        <Skeleton variant="text" height={20} width="60%" animation={animation} sx={{ mt: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="text" height={16} width={100} animation={animation} />
          <Skeleton variant="text" height={16} width={80} animation={animation} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Skeleton variant="text" height={24} width={120} animation={animation} />
          <Skeleton variant="circular" width={32} height={32} animation={animation} />
        </Box>
      </CardContent>
    </Card>
  )

  const renderTripList = () => (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Skeleton variant="rectangular" width={60} height={60} animation={animation} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" height={24} width="70%" animation={animation} />
              <Skeleton variant="text" height={16} width="50%" animation={animation} />
              <Skeleton variant="text" height={16} width="40%" animation={animation} />
            </Box>
            <Skeleton variant="text" height={16} width={80} animation={animation} />
          </Box>
        </Box>
      ))}
    </Box>
  )

  const renderChatMessage = () => (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
      <Skeleton variant="circular" width={32} height={32} animation={animation} />
      <Box sx={{ flex: 1, maxWidth: '70%' }}>
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} animation={animation} />
        <Skeleton variant="text" height={12} width={120} sx={{ mt: 0.5 }} animation={animation} />
      </Box>
    </Box>
  )

  const renderItinerary = () => (
    <Box>
      {Array.from({ length: count }).map((_, dayIndex) => (
        <Card key={dayIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Skeleton variant="text" height={28} width={100} animation={animation} />
                <Skeleton variant="text" height={16} width={180} animation={animation} />
              </Box>
              <Skeleton variant="text" width={100} height={20} animation={animation} />
            </Box>
            
            {Array.from({ length: 3 }).map((_, activityIndex) => (
              <Box key={activityIndex} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" height={20} width="60%" animation={animation} />
                  <Skeleton variant="text" height={16} width="40%" animation={animation} />
                </Box>
                <Skeleton variant="text" width={80} height={16} animation={animation} />
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}
    </Box>
  )

  const renderBookingCard = () => (
    <Card>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <Skeleton
          variant="rectangular"
          width={{ xs: '100%', md: 200 }}
          height={{ xs: 200, md: 'auto' }}
          animation={animation}
        />
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" height={28} width="70%" animation={animation} />
              <Skeleton variant="text" height={16} width="50%" animation={animation} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={24} animation={animation} />
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Skeleton variant="text" height={16} width={150} animation={animation} />
            <Skeleton variant="text" height={16} width={120} animation={animation} />
            <Skeleton variant="text" height={16} width={100} animation={animation} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" height={24} width={120} animation={animation} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
              <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Card>
  )

  const renderSkeleton = () => {
    switch (variant) {
      case 'trip-card':
        return (
          <Grid container spacing={3}>
            {Array.from({ length: count }).map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                {renderTripCard()}
              </Grid>
            ))}
          </Grid>
        )
      
      case 'trip-list':
        return renderTripList()
      
      case 'chat-message':
        return (
          <Box>
            {Array.from({ length: count }).map((_, index) => (
              <React.Fragment key={index}>
                {renderChatMessage()}
              </React.Fragment>
            ))}
          </Box>
        )
      
      case 'itinerary':
        return renderItinerary()
      
      case 'booking-card':
        return (
          <Box>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                {renderBookingCard()}
              </Box>
            ))}
          </Box>
        )
      
      default:
        return (
          <Box>
            {Array.from({ length: count }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={height}
                width={width}
                animation={animation}
                sx={{ mb: index < count - 1 ? 1 : 0 }}
              />
            ))}
          </Box>
        )
    }
  }

  return renderSkeleton()
}