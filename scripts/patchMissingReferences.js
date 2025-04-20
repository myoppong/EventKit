import axios from 'axios';
import mongoose from 'mongoose';
import {ticketModel} from '../models/ticket.js'; // Adjust the import to your model
import dotenv from 'dotenv';
dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.PAYSTACK_BASE_URL;

export const initializeTransaction = async ({ email, amount, metadata, currency = 'GHS' }) => {
  return await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount,
      metadata,
      currency,
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
    }
  );
};


const verifyTransaction = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error verifying transaction for reference: ${reference}`, error);
    return null;
  }
};

const updateTicketsWithReferences = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.db_URL);
    console.log(' Connected to MongoDB');

    const tickets = await ticketModel.find({ reference: { $exists: false } });

    if (tickets.length === 0) {
      console.log(' All tickets already have references.');
      return process.exit(0);
    }

    for (const ticket of tickets) {
        if (!ticket.transactionReference) {
          console.warn(`Ticket ${ticket.id} has no transactionReference. Skipping...`);
          continue;
        }
      
        const transactionData = await verifyTransaction(ticket.transactionReference);
      
        if (
          !transactionData ||
          !transactionData.data ||
          !transactionData.data.reference
        ) {
          console.error(`Unable to verify ticket ${ticket.id}`);
          continue;
        }
      
        const reference = transactionData.data.reference;
        ticket.reference = reference;
      
        console.log(`Updating ticket ${ticket.id} with reference: ${reference}`);
        await ticket.save();
      }
      

    console.log(' All missing references updated!');
    process.exit(0);
  } catch (err) {
    console.error(' Error updating tickets:', err);
    process.exit(1);
  }
};

updateTicketsWithReferences();
