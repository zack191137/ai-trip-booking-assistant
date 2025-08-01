import { Request, Response, NextFunction } from 'express';
import { tripGenerationService } from '../services/trip/TripGenerationService';
import { pdfService } from '../services/pdf';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

class TripController {
  async generateTrip(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { conversationId } = req.body;
      const trip = await tripGenerationService.generateTrip(conversationId, req.user.id);

      res.status(201).json({
        success: true,
        data: {
          message: 'Trip generated successfully',
          trip,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrips(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const trips = await tripGenerationService.getTripsByUser(req.user.id);

      res.json({
        success: true,
        data: { trips },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrip(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      res.json({
        success: true,
        data: { trip },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTrip(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const updates = req.body;
      
      const trip = await tripGenerationService.updateTrip(id, req.user.id, updates);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          message: 'Trip updated successfully',
          trip,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmTrip(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const trip = await tripGenerationService.confirmTrip(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          message: 'Trip confirmed successfully',
          trip,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTrip(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const success = await tripGenerationService.deleteTrip(id, req.user.id);

      if (!success) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          message: 'Trip deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async generateTripPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      const pdfBuffer = await pdfService.generateTripItinerary(trip, { template: 'standard' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="trip-${trip.destination}-${trip.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateMinimalTripPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      const pdfBuffer = await pdfService.generateTripItinerary(trip, { template: 'minimal' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="trip-minimal-${trip.destination}-${trip.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateDetailedTripPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      const pdfBuffer = await pdfService.generateTripItinerary(trip, { template: 'detailed' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="trip-detailed-${trip.destination}-${trip.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateFlightTicketPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id, flightIndex } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      const flightIdx = parseInt(flightIndex);
      if (!trip.flights || flightIdx >= trip.flights.length || flightIdx < 0) {
        throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
      }

      const flight = trip.flights[flightIdx];
      const pdfBuffer = await pdfService.generateFlightTicket(flight);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="flight-ticket-${flight.flightNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateHotelVoucherPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id, hotelIndex } = req.params;
      const trip = await tripGenerationService.getTripById(id, req.user.id);

      if (!trip) {
        throw new AppError('Trip not found', 404, 'TRIP_NOT_FOUND');
      }

      const hotelIdx = parseInt(hotelIndex);
      if (!trip.hotels || hotelIdx >= trip.hotels.length || hotelIdx < 0) {
        throw new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
      }

      const hotel = trip.hotels[hotelIdx];
      const pdfBuffer = await pdfService.generateHotelVoucher(hotel);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="hotel-voucher-${hotel.name.replace(/\s+/g, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const tripController = new TripController();