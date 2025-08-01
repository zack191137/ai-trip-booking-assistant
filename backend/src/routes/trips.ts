import { Router } from 'express';
import { tripController } from '../controllers/TripController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { generateTripSchema, updateTripSchema, uuidSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Trip management routes
router.post('/generate', validateBody(generateTripSchema), tripController.generateTrip);
router.get('/', tripController.getTrips);
router.get('/:id', validateParams(uuidSchema), tripController.getTrip);
router.put('/:id', validateParams(uuidSchema), validateBody(updateTripSchema), tripController.updateTrip);
router.post('/:id/confirm', validateParams(uuidSchema), tripController.confirmTrip);
router.delete('/:id', validateParams(uuidSchema), tripController.deleteTrip);

// PDF generation routes
router.get('/:id/pdf', validateParams(uuidSchema), tripController.generateTripPdf);
router.get('/:id/pdf/minimal', validateParams(uuidSchema), tripController.generateMinimalTripPdf);
router.get('/:id/pdf/detailed', validateParams(uuidSchema), tripController.generateDetailedTripPdf);
router.get('/:id/flights/:flightIndex/pdf', validateParams(uuidSchema), tripController.generateFlightTicketPdf);
router.get('/:id/hotels/:hotelIndex/pdf', validateParams(uuidSchema), tripController.generateHotelVoucherPdf);

export default router;