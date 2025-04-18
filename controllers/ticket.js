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



