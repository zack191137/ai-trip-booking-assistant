import { pdfService } from '../../../src/services/pdf/PdfService';
import { TripPlan, FlightDetails, HotelDetails } from '../../../src/types';

describe('PdfService', () => {
  let mockTrip: TripPlan;

  beforeEach(() => {
    
    mockTrip = {
      id: 'test-trip-id',
      userId: 'test-user-id',
      conversationId: 'test-conversation-id',
      status: 'confirmed',
      destination: 'Paris, France',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-05'),
      travelers: 2,
      flights: [
        {
          airline: 'Air France',
          flightNumber: 'AF123',
          departure: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
          arrival: { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
          departureTime: new Date('2024-06-01T08:00:00Z'),
          arrivalTime: new Date('2024-06-01T20:00:00Z'),
          price: { amount: 800, currency: 'USD' },
          class: 'economy'
        }
      ] as FlightDetails[],
      hotels: [
        {
          name: 'Hotel de Paris',
          address: '123 Rue de Rivoli, Paris',
          checkIn: new Date('2024-06-01'),
          checkOut: new Date('2024-06-05'),
          roomType: 'Double Room',
          price: { amount: 200, currency: 'USD' },
          amenities: ['WiFi', 'Breakfast', 'Pool'],
          rating: 4.5
        }
      ] as HotelDetails[],
      restaurants: [],
      totalEstimatedCost: { amount: 2000, currency: 'USD' },
      itinerary: [
        {
          date: new Date('2024-06-01'),
          activities: [
            {
              name: 'Flight Arrival',
              time: '20:00',
              type: 'flight',
              details: {}
            },
            {
              name: 'Hotel Check-in',
              time: '21:30',
              type: 'hotel_checkin',
              details: {}
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('generateTripItinerary', () => {
    it('should generate PDF buffer for standard template', async () => {
      const pdfBuffer = await pdfService.generateTripItinerary(mockTrip, { template: 'standard' });
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF should have reasonable size
    });

    it('should generate PDF buffer for minimal template', async () => {
      const pdfBuffer = await pdfService.generateTripItinerary(mockTrip, { template: 'minimal' });
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });

    it('should generate PDF buffer for detailed template', async () => {
      const pdfBuffer = await pdfService.generateTripItinerary(mockTrip, { template: 'detailed' });
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1500);
    });

    it('should handle trip with minimal data', async () => {
      const minimalTrip = {
        ...mockTrip,
        flights: [],
        hotels: [],
        itinerary: []
      };

      const pdfBuffer = await pdfService.generateTripItinerary(minimalTrip);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(100);
    });
  });

  describe('generateFlightTicket', () => {
    it('should generate flight ticket PDF', async () => {
      const flight = mockTrip.flights![0];
      const pdfBuffer = await pdfService.generateFlightTicket(flight);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });
  });

  describe('generateHotelVoucher', () => {
    it('should generate hotel voucher PDF', async () => {
      const hotel = mockTrip.hotels![0];
      const pdfBuffer = await pdfService.generateHotelVoucher(hotel);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });
  });

  describe('error handling', () => {
    it('should handle PDF generation errors gracefully', async () => {
      // Mock jsPDF to throw an error
      const originalOutput = pdfService['doc'].output;
      pdfService['doc'].output = jest.fn().mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      await expect(pdfService.generateTripItinerary(mockTrip))
        .rejects
        .toThrow('Failed to generate PDF itinerary');

      // Restore original method
      pdfService['doc'].output = originalOutput;
    });
  });
});