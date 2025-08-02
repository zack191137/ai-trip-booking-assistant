import jsPDF from 'jspdf'
import { TripPlan } from '@/types/trip'
import { format } from 'date-fns'

export class PDFGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.pdf = new jsPDF()
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
    this.margin = 20
  }

  private addHeader(title: string) {
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, this.margin, 30)
    
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, this.margin, 40)
    
    // Add line
    this.pdf.line(this.margin, 45, this.pageWidth - this.margin, 45)
  }

  private addSection(title: string, y: number): number {
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, this.margin, y)
    return y + 10
  }

  private addText(text: string, x: number, y: number, options?: { fontSize?: number; font?: string }): number {
    const fontSize = options?.fontSize || 10
    const font = options?.font || 'normal'
    
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', font)
    
    const lines = this.pdf.splitTextToSize(text, this.pageWidth - 2 * this.margin)
    this.pdf.text(lines, x, y)
    
    return y + (lines.length * fontSize * 0.5)
  }

  private checkPageBreak(currentY: number, neededSpace: number = 50): number {
    if (currentY + neededSpace > this.pageHeight - this.margin) {
      this.pdf.addPage()
      return this.margin + 20
    }
    return currentY
  }

  generateTripItinerary(trip: TripPlan): Blob {
    this.addHeader(`Trip Itinerary: ${trip.title}`)
    
    let currentY = 60

    // Trip Overview
    currentY = this.addSection('Trip Overview', currentY)
    currentY = this.addText(`Destination: ${trip.destination.city}, ${trip.destination.country}`, this.margin, currentY) + 5
    currentY = this.addText(`Dates: ${format(new Date(trip.dates.startDate), 'MMMM d, yyyy')} - ${format(new Date(trip.dates.endDate), 'MMMM d, yyyy')}`, this.margin, currentY) + 5
    currentY = this.addText(`Duration: ${trip.dates.duration} days`, this.margin, currentY) + 5
    currentY = this.addText(`Travelers: ${trip.travelers.adults} adult${trip.travelers.adults !== 1 ? 's' : ''}${trip.travelers.children > 0 ? `, ${trip.travelers.children} child${trip.travelers.children !== 1 ? 'ren' : ''}` : ''}`, this.margin, currentY) + 5
    currentY = this.addText(`Budget: ${trip.budget.currency} ${trip.budget.total.toLocaleString()}`, this.margin, currentY) + 15

    if (trip.description) {
      currentY = this.addText(trip.description, this.margin, currentY) + 15
    }

    // Itinerary by Day
    if (trip.itinerary.length > 0) {
      currentY = this.checkPageBreak(currentY, 100)
      currentY = this.addSection('Daily Itinerary', currentY)

      const groupedActivities = this.groupActivitiesByDay(trip.itinerary)
      const days = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b)

      days.forEach(day => {
        currentY = this.checkPageBreak(currentY, 80)
        
        const dayDate = new Date(trip.dates.startDate)
        dayDate.setDate(dayDate.getDate() + day - 1)
        
        currentY = this.addText(`Day ${day} - ${format(dayDate, 'EEEE, MMMM d, yyyy')}`, this.margin, currentY, { fontSize: 12, font: 'bold' }) + 5

        groupedActivities[day].forEach(activity => {
          currentY = this.checkPageBreak(currentY, 40)
          currentY = this.addText(`${activity.time} - ${activity.name}`, this.margin + 10, currentY, { font: 'bold' }) + 3
          currentY = this.addText(`Type: ${activity.type} | Duration: ${activity.duration} hours | Price: ${activity.price.currency} ${activity.price.amount}`, this.margin + 10, currentY) + 3
          currentY = this.addText(`Location: ${activity.location.name}`, this.margin + 10, currentY) + 3
          if (activity.description) {
            currentY = this.addText(activity.description, this.margin + 10, currentY) + 5
          }
          currentY += 5
        })
        
        currentY += 5
      })
    }

    return new Blob([this.pdf.output('blob')], { type: 'application/pdf' })
  }

  generateBookingConfirmation(trip: TripPlan): Blob {
    this.addHeader(`Booking Confirmation: ${trip.title}`)
    
    let currentY = 60

    // Trip Overview
    currentY = this.addSection('Trip Details', currentY)
    currentY = this.addText(`Destination: ${trip.destination.city}, ${trip.destination.country}`, this.margin, currentY) + 5
    currentY = this.addText(`Dates: ${format(new Date(trip.dates.startDate), 'MMMM d, yyyy')} - ${format(new Date(trip.dates.endDate), 'MMMM d, yyyy')}`, this.margin, currentY) + 5
    currentY = this.addText(`Travelers: ${trip.travelers.adults} adult${trip.travelers.adults !== 1 ? 's' : ''}${trip.travelers.children > 0 ? `, ${trip.travelers.children} child${trip.travelers.children !== 1 ? 'ren' : ''}` : ''}`, this.margin, currentY) + 15

    // Flight Bookings
    if (trip.bookings.flights.length > 0) {
      currentY = this.checkPageBreak(currentY, 100)
      currentY = this.addSection('Flight Bookings', currentY)

      trip.bookings.flights.forEach(flight => {
        currentY = this.checkPageBreak(currentY, 60)
        currentY = this.addText(`${flight.airline} ${flight.flightNumber} (${flight.type})`, this.margin, currentY, { font: 'bold' }) + 3
        currentY = this.addText(`${flight.from.city} (${flight.from.code}) → ${flight.to.city} (${flight.to.code})`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Departure: ${flight.departure.date} at ${flight.departure.time}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Arrival: ${flight.arrival.date} at ${flight.arrival.time}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Class: ${flight.class} | Passengers: ${flight.passengers}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Price: ${flight.price.currency} ${flight.price.amount.toLocaleString()}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Status: ${flight.status.toUpperCase()}`, this.margin + 10, currentY) + 3
        if (flight.confirmationCode) {
          currentY = this.addText(`Confirmation Code: ${flight.confirmationCode}`, this.margin + 10, currentY, { font: 'bold' }) + 8
        }
        currentY += 5
      })
    }

    // Hotel Bookings
    if (trip.bookings.hotels.length > 0) {
      currentY = this.checkPageBreak(currentY, 100)
      currentY = this.addSection('Hotel Bookings', currentY)

      trip.bookings.hotels.forEach(hotel => {
        currentY = this.checkPageBreak(currentY, 60)
        currentY = this.addText(hotel.name, this.margin, currentY, { font: 'bold' }) + 3
        currentY = this.addText(hotel.address, this.margin + 10, currentY) + 3
        currentY = this.addText(`Check-in: ${hotel.checkIn} | Check-out: ${hotel.checkOut}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`${hotel.nights} nights | ${hotel.rooms} room${hotel.rooms !== 1 ? 's' : ''} | ${hotel.guests} guest${hotel.guests !== 1 ? 's' : ''}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Room Type: ${hotel.roomType}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Price: ${hotel.price.currency} ${hotel.price.amount.toLocaleString()} (${hotel.price.currency} ${hotel.price.perNight}/night)`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Status: ${hotel.status.toUpperCase()}`, this.margin + 10, currentY) + 3
        if (hotel.confirmationCode) {
          currentY = this.addText(`Confirmation Code: ${hotel.confirmationCode}`, this.margin + 10, currentY, { font: 'bold' }) + 8
        }
        currentY += 5
      })
    }

    // Activity Bookings
    if (trip.bookings.activities.length > 0) {
      currentY = this.checkPageBreak(currentY, 100)
      currentY = this.addSection('Activity Bookings', currentY)

      trip.bookings.activities.forEach(activity => {
        currentY = this.checkPageBreak(currentY, 50)
        currentY = this.addText(activity.name, this.margin, currentY, { font: 'bold' }) + 3
        currentY = this.addText(`Date: ${activity.date} at ${activity.time}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Duration: ${activity.duration} minutes | Participants: ${activity.participants}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Location: ${activity.location}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Price: ${activity.price.currency} ${activity.price.amount.toLocaleString()}`, this.margin + 10, currentY) + 3
        currentY = this.addText(`Status: ${activity.status.toUpperCase()}`, this.margin + 10, currentY) + 3
        if (activity.confirmationCode) {
          currentY = this.addText(`Confirmation Code: ${activity.confirmationCode}`, this.margin + 10, currentY, { font: 'bold' }) + 8
        }
        currentY += 5
      })
    }

    // Total Cost
    currentY = this.checkPageBreak(currentY, 50)
    currentY += 10
    this.pdf.line(this.margin, currentY, this.pageWidth - this.margin, currentY)
    currentY += 10
    currentY = this.addText(`Total Trip Cost: ${trip.budget.currency} ${trip.budget.total.toLocaleString()}`, this.margin, currentY, { fontSize: 14, font: 'bold' })

    return new Blob([this.pdf.output('blob')], { type: 'application/pdf' })
  }

  private groupActivitiesByDay(activities: Array<{ day: number }>) {
    const grouped: { [key: number]: Array<{ day: number }> } = {}
    
    activities.forEach(activity => {
      if (!grouped[activity.day]) {
        grouped[activity.day] = []
      }
      grouped[activity.day].push(activity)
    })

    // Sort activities within each day by time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.time.localeCompare(b.time))
    })

    return grouped
  }

  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const pdfGenerator = new PDFGenerator()