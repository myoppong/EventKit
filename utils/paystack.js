import axios from 'axios';

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

export const verifyTransaction = async (reference) => {
  return await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
  });
};

