import jsPDF from 'jspdf';
import { TripPlan, FlightDetails, HotelDetails, RestaurantDetails } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export interface PdfGenerationOptions {
  includeQRCode?: boolean;
  includeMap?: boolean;
  template?: 'standard' | 'minimal' | 'detailed';
}

export class PdfService {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  async generateTripItinerary(
    trip: TripPlan,
    options: PdfGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      // Initialize new PDF document
      this.doc = new jsPDF();
      
      // Set default options
      const opts = {
        includeQRCode: false,
        includeMap: false,
        template: 'standard' as const,
        ...options,
      };

      // Generate PDF content based on template
      switch (opts.template) {
        case 'minimal':
          this.generateMinimalTemplate(trip);
          break;
        case 'detailed':
          this.generateDetailedTemplate(trip);
          break;
        default:
          this.generateStandardTemplate(trip);
      }

      // Convert to buffer
      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new AppError('Failed to generate PDF itinerary', 500, 'PDF_GENERATION_FAILED');
    }
  }

  private generateStandardTemplate(trip: TripPlan): void {
    let yPosition = 20;

    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Trip Itinerary', 20, yPosition);
    yPosition += 15;

    // Trip overview
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Destination: ${trip.destination}`, 20, yPosition);
    yPosition += 8;
    this.doc.text(`Duration: ${this.formatDateRange(trip.startDate, trip.endDate)}`, 20, yPosition);
    yPosition += 8;
    this.doc.text(`Total Cost: ${this.formatMoney(trip.totalEstimatedCost)}`, 20, yPosition);
    yPosition += 15;

    // Day-by-day itinerary
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Daily Itinerary', 20, yPosition);
    yPosition += 10;

    trip.itinerary.forEach((day, index) => {
      yPosition = this.addDaySection(day, index + 1, yPosition);
    });

    // Flight details
    if (trip.flights && trip.flights.length > 0) {
      yPosition = this.addFlightSection(trip.flights, yPosition);
    }

    // Hotel details
    if (trip.hotels && trip.hotels.length > 0) {
      yPosition = this.addHotelSection(trip.hotels, yPosition);
    }

    // Footer
    this.addFooter();
  }

  private generateMinimalTemplate(trip: TripPlan): void {
    let yPosition = 20;

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${trip.destination} Trip`, 20, yPosition);
    yPosition += 12;

    // Basic info
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${this.formatDateRange(trip.startDate, trip.endDate)} | ${this.formatMoney(trip.totalEstimatedCost)}`, 20, yPosition);
    yPosition += 15;

    // Condensed daily summary
    trip.itinerary.forEach((day, index) => {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Day ${index + 1}:`, 20, yPosition);
      
      const activities = day.activities.map(a => a.name).join(', ');
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(activities, 45, yPosition);
      yPosition += 6;

      // Check if we need a new page
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }
    });
  }

  private generateDetailedTemplate(trip: TripPlan): void {
    let yPosition = 20;

    // Enhanced title page
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Complete Trip Itinerary', 20, yPosition);
    yPosition += 20;

    // Trip summary box
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(15, yPosition - 5, 180, 30);
    
    this.doc.setFontSize(12);
    this.doc.text(`Destination: ${trip.destination}`, 20, yPosition + 5);
    this.doc.text(`Dates: ${this.formatDateRange(trip.startDate, trip.endDate)}`, 20, yPosition + 12);
    this.doc.text(`Budget: ${this.formatMoney(trip.totalEstimatedCost)}`, 20, yPosition + 19);
    yPosition += 40;

    // Detailed day sections
    trip.itinerary.forEach((day, index) => {
      yPosition = this.addDetailedDaySection(day, index + 1, yPosition);
    });

    // Comprehensive flight details
    if (trip.flights && trip.flights.length > 0) {
      yPosition = this.addDetailedFlightSection(trip.flights, yPosition);
    }

    // Comprehensive hotel details
    if (trip.hotels && trip.hotels.length > 0) {
      yPosition = this.addDetailedHotelSection(trip.hotels, yPosition);
    }

    this.addFooter();
  }

  private addDaySection(day: any, dayNumber: number, yPosition: number): number {
    // Check if we need a new page
    if (yPosition > 250) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Day ${dayNumber} - ${this.formatDateOnly(day.date)}`, 20, yPosition);
    yPosition += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    day.activities.forEach((activity: any) => {
      this.doc.text(`• ${activity.name}`, 25, yPosition);
      yPosition += 5;
      if (activity.description) {
        const lines = this.splitText(activity.description, 150);
        lines.forEach((line: string) => {
          this.doc.text(`  ${line}`, 30, yPosition);
          yPosition += 4;
        });
      }
      yPosition += 2;
    });

    return yPosition + 5;
  }

  private addDetailedDaySection(day: any, dayNumber: number, yPosition: number): number {
    // Check if we need a new page
    if (yPosition > 230) {
      this.doc.addPage();
      yPosition = 20;
    }

    // Day header with background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(15, yPosition - 3, 180, 12, 'F');
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Day ${dayNumber} - ${this.formatDateOnly(day.date)}`, 20, yPosition + 5);
    yPosition += 15;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    day.activities.forEach((activity: any, index: number) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${activity.name}`, 25, yPosition);
      yPosition += 6;

      this.doc.setFont('helvetica', 'normal');
      if (activity.description) {
        const lines = this.splitText(activity.description, 140);
        lines.forEach((line: string) => {
          this.doc.text(`   ${line}`, 30, yPosition);
          yPosition += 4;
        });
      }

      if (activity.estimatedCost) {
        this.doc.text(`   Cost: ${this.formatMoney(activity.estimatedCost)}`, 30, yPosition);
        yPosition += 4;
      }
      
      yPosition += 3;
    });

    return yPosition + 8;
  }

  private addFlightSection(flights: FlightDetails[], yPosition: number): number {
    if (yPosition > 200) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Flight Details', 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    flights.forEach((flight) => {
      this.doc.text(`${flight.airline} ${flight.flightNumber}`, 20, yPosition);
      yPosition += 5;
      this.doc.text(`${flight.departure.code} → ${flight.arrival.code}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`${this.formatDateTime(flight.departureTime)} - ${this.formatDateTime(flight.arrivalTime)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Price: ${this.formatMoney(flight.price)}`, 25, yPosition);
      yPosition += 8;
    });

    return yPosition;
  }

  private addDetailedFlightSection(flights: FlightDetails[], yPosition: number): number {
    if (yPosition > 180) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Flight Information', 20, yPosition);
    yPosition += 12;

    flights.forEach((flight, index) => {
      // Flight header
      this.doc.setFillColor(250, 250, 250);
      this.doc.rect(15, yPosition - 3, 180, 10, 'F');
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Flight ${index + 1}: ${flight.airline} ${flight.flightNumber}`, 20, yPosition + 3);
      yPosition += 15;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Route: ${flight.departure.name} → ${flight.arrival.name}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Departure: ${this.formatDateTime(flight.departureTime)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Arrival: ${this.formatDateTime(flight.arrivalTime)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Class: ${flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Price: ${this.formatMoney(flight.price)}`, 25, yPosition);
      yPosition += 10;
    });

    return yPosition;
  }

  private addHotelSection(hotels: HotelDetails[], yPosition: number): number {
    if (yPosition > 200) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Hotel Details', 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    hotels.forEach((hotel) => {
      this.doc.text(hotel.name, 20, yPosition);
      yPosition += 5;
      this.doc.text(hotel.address, 25, yPosition);
      yPosition += 5;
      this.doc.text(`${this.formatDateOnly(hotel.checkIn)} - ${this.formatDateOnly(hotel.checkOut)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`${hotel.roomType} | Rating: ${hotel.rating}/5`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Price: ${this.formatMoney(hotel.price)} per night`, 25, yPosition);
      yPosition += 8;
    });

    return yPosition;
  }

  private addDetailedHotelSection(hotels: HotelDetails[], yPosition: number): number {
    if (yPosition > 180) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Accommodation Details', 20, yPosition);
    yPosition += 12;

    hotels.forEach((hotel, index) => {
      // Hotel header
      this.doc.setFillColor(250, 250, 250);
      this.doc.rect(15, yPosition - 3, 180, 10, 'F');
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Hotel ${index + 1}: ${hotel.name}`, 20, yPosition + 3);
      yPosition += 15;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Address: ${hotel.address}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Check-in: ${this.formatDateOnly(hotel.checkIn)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Check-out: ${this.formatDateOnly(hotel.checkOut)}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Room Type: ${hotel.roomType}`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Rating: ${hotel.rating}/5 stars`, 25, yPosition);
      yPosition += 5;
      this.doc.text(`Price: ${this.formatMoney(hotel.price)} per night`, 25, yPosition);
      yPosition += 5;
      
      if (hotel.amenities && hotel.amenities.length > 0) {
        this.doc.text(`Amenities: ${hotel.amenities.join(', ')}`, 25, yPosition);
        yPosition += 5;
      }
      
      yPosition += 8;
    });

    return yPosition;
  }

  private addFooter(): void {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Generated by Trip Booking Assistant', 20, 285);
      this.doc.text(`Page ${i} of ${pageCount}`, 160, 285);
      this.doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290);
    }
  }

  private formatDateRange(startDate: Date, endDate: Date): string {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  }

  private formatDateOnly(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  private formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  private formatMoney(money: { amount: number; currency: string }): string {
    return `${money.currency} ${money.amount.toFixed(2)}`;
  }

  private splitText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = this.doc.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  async generateFlightTicket(flight: FlightDetails): Promise<Buffer> {
    try {
      this.doc = new jsPDF();
      
      // Ticket header
      this.doc.setFillColor(0, 100, 200);
      this.doc.rect(0, 0, 210, 30, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('BOARDING PASS', 20, 20);
      
      // Reset text color
      this.doc.setTextColor(0, 0, 0);
      
      // Flight details
      let yPos = 50;
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${flight.airline} ${flight.flightNumber}`, 20, yPos);
      
      yPos += 15;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`From: ${flight.departure.name} (${flight.departure.code})`, 20, yPos);
      yPos += 8;
      this.doc.text(`To: ${flight.arrival.name} (${flight.arrival.code})`, 20, yPos);
      yPos += 8;
      this.doc.text(`Departure: ${this.formatDateTime(flight.departureTime)}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Arrival: ${this.formatDateTime(flight.arrivalTime)}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Class: ${flight.class.toUpperCase()}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Price: ${this.formatMoney(flight.price)}`, 20, yPos);

      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
    } catch (error) {
      console.error('Flight ticket PDF generation error:', error);
      throw new AppError('Failed to generate flight ticket PDF', 500, 'PDF_GENERATION_FAILED');
    }
  }

  async generateHotelVoucher(hotel: HotelDetails): Promise<Buffer> {
    try {
      this.doc = new jsPDF();
      
      // Voucher header
      this.doc.setFillColor(200, 150, 0);
      this.doc.rect(0, 0, 210, 30, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('HOTEL VOUCHER', 20, 20);
      
      // Reset text color
      this.doc.setTextColor(0, 0, 0);
      
      // Hotel details
      let yPos = 50;
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(hotel.name, 20, yPos);
      
      yPos += 15;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Address: ${hotel.address}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Check-in: ${this.formatDateOnly(hotel.checkIn)}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Check-out: ${this.formatDateOnly(hotel.checkOut)}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Room Type: ${hotel.roomType}`, 20, yPos);
      yPos += 8;
      this.doc.text(`Rating: ${hotel.rating}/5 stars`, 20, yPos);
      yPos += 8;
      this.doc.text(`Price: ${this.formatMoney(hotel.price)} per night`, 20, yPos);
      
      if (hotel.amenities && hotel.amenities.length > 0) {
        yPos += 10;
        this.doc.text('Amenities:', 20, yPos);
        yPos += 6;
        hotel.amenities.forEach((amenity) => {
          this.doc.text(`• ${amenity}`, 25, yPos);
          yPos += 5;
        });
      }

      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
    } catch (error) {
      console.error('Hotel voucher PDF generation error:', error);
      throw new AppError('Failed to generate hotel voucher PDF', 500, 'PDF_GENERATION_FAILED');
    }
  }
}

export const pdfService = new PdfService();

/*
 * NOTE: This is a P0 implementation using jsPDF for client-side PDF generation.
 * 
 * For P1 enhancements:
 * - Add QR code generation for bookings
 * - Implement custom templates and branding
 * - Add map integration for locations
 * - Support for multiple languages
 * - Enhanced styling and graphics
 * - PDF form filling for booking confirmations
 * - Integration with email services for PDF delivery
 * - PDF password protection for sensitive bookings
 * - Batch PDF generation for multiple travelers
 */