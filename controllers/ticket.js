// controllers/ticketController.js
import { ticketModel } from '../models/ticket.js';
import { generateQRCode } from '../utils/qrcode.js';
import { imagekit } from "../utils/imagekit.js";
import { initializeTransaction } from '../utils/paystack.js';
export const initiatePurchase = async (req, res) => {
  try {
    const { ticketId, quantity = 1, customFieldResponses = [] } = req.body;
    const user = req.auth;

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.soldCount + quantity > ticket.quantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    const amount = ticket.price * quantity * 100;

    const response = await initializeTransaction({
      email: user.email,
      amount,
      metadata: {
        ticketId,
        userId: user.id,
        quantity,
        customFieldResponses,
      },
      currency: 'GHS',
    });

    const { authorization_url, reference } = response.data.data;
    res.status(200).json({ url: authorization_url, reference });
  } catch (err) {
    console.error("Init Paystack Error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Could not initiate payment" });
  }
};

// Attendee - Get My Tickets
// Attendee - Get My Tickets after payment
export const getMyTicketsAfterPayment = async (req, res) => {
  try {
    const userId = req.auth.id;
    const { reference } = req.query;

    const tickets = await ticketModel.find({ 'instances.buyer': userId })
      .populate('event')
      .lean();

    const result = [];

    tickets.forEach(ticket => {
      let userInstances = ticket.instances.filter(inst => inst.buyer?.toString() === userId);

      // Optional: filter by payment reference
      if (reference) {
        userInstances = userInstances.filter(inst => inst.reference?.startsWith(reference));
      }

      userInstances.forEach(instance => {
        result.push({
          ticketId: ticket.id,
          event: ticket.event.title,
          date: ticket.event.startDate,
          ticketType: ticket.type,
          qrCode: instance.qrCode,
          ticketNumber: instance.ticketNumber,
          status: instance.status,
          reference: instance.reference
        });
      });
    });

    res.status(200).json({ tickets: result });
  } catch (err) {
    console.error('Error getting user tickets:', err);
    res.status(500).json({ message: 'Server error fetching tickets.' });
  }
};


// Attendee - Get ALL My Tickets (Printable Anytime)
export const getAllMyTickets = async (req, res) => {
  try {
    const userId = req.auth.id;

    // Find all tickets where this user has at least one ticket instance
    const tickets = await ticketModel.find({ 'instances.buyer': userId })
      .populate('event')
      .lean();

    const result = [];

    tickets.forEach(ticket => {
      const userInstances = ticket.instances.filter(inst => inst.buyer?.toString() === userId);
      userInstances.forEach(instance => {
        result.push({
          ticketId: ticket._id,
          eventTitle: ticket.event.title,
          eventDate: ticket.event.startDate,
          ticketType: ticket.type,
          ticketNumber: instance.ticketNumber,
          status: instance.status,
          qrCodeImage: instance.qrCode,  // This is the full overlaid ticket image
        });
      });
    });

    res.status(200).json({ tickets: result });
  } catch (err) {
    console.error('Error fetching user’s tickets:', err);
    res.status(500).json({ message: 'Unable to fetch tickets at the moment.' });
  }
};
