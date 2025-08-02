import React from 'react'
import { render, screen, fireEvent } from '@/utils/test-utils'
import { TripCard } from '@/components/trip/TripCard'
import { createMockTrip } from '@/utils/test-utils'

describe('TripCard', () => {
  const mockTrip = createMockTrip()
  const mockProps = {
    trip: mockTrip,
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onShare: vi.fn(),
    onDownload: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trip information correctly', () => {
    render(<TripCard {...mockProps} />)
    
    expect(screen.getByText(mockTrip.title)).toBeInTheDocument()
    expect(screen.getByText(`${mockTrip.destination.city}, ${mockTrip.destination.country}`)).toBeInTheDocument()
    expect(screen.getByText(/7 days/)).toBeInTheDocument()
    expect(screen.getByText(/2 adults/)).toBeInTheDocument()
    expect(screen.getByText(/USD 3,000/)).toBeInTheDocument()
  })

  it('displays correct status chip', () => {
    render(<TripCard {...mockProps} />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('calls onSelect when card is clicked', () => {
    render(<TripCard {...mockProps} />)
    fireEvent.click(screen.getByText(mockTrip.title))
    expect(mockProps.onSelect).toHaveBeenCalledWith(mockTrip.id)
  })

  it('opens menu when more options button is clicked', () => {
    render(<TripCard {...mockProps} />)
    const moreButton = screen.getByLabelText(/more/i)
    fireEvent.click(moreButton)
    
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
    expect(screen.getByText('Share Trip')).toBeInTheDocument()
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Delete Trip')).toBeInTheDocument()
  })

  it('calls appropriate handlers from menu', () => {
    render(<TripCard {...mockProps} />)
    const moreButton = screen.getByLabelText(/more/i)
    fireEvent.click(moreButton)
    
    fireEvent.click(screen.getByText('Edit Trip'))
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockTrip.id)
  })

  it('shows booking progress when trip has bookings', () => {
    const tripWithBookings = createMockTrip({
      bookings: {
        flights: [{ id: '1', status: 'confirmed' }],
        hotels: [{ id: '2', status: 'pending' }],
        activities: [],
      },
    })
    
    render(<TripCard {...mockProps} trip={tripWithBookings} />)
    expect(screen.getByText('Booking Progress')).toBeInTheDocument()
  })

  it('renders children count when present', () => {
    const tripWithChildren = createMockTrip({
      travelers: { adults: 2, children: 1 },
    })
    
    render(<TripCard {...mockProps} trip={tripWithChildren} />)
    expect(screen.getByText(/2 adults, 1 child/)).toBeInTheDocument()
  })
})