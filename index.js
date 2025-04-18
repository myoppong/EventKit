import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import payRouter from './routes/webhook.js';
import userRouter from './routes/user.js';
import { userModel } from './models/user.js';
import eventRouter from './routes/eventAndTicket.js';
import ticketRouter from './routes/tickets.js';

dotenv.config();

const app = express();

// Before any express.json middleware
app.use(payRouter);

app.use(express.json());

// Routes
app.use(ticketRouter)
app.use(userRouter);
app.use(eventRouter)

// Connect to MongoDB
await mongoose.connect(process.env.db_url);
console.log(' MongoDB connected');

// Create Admin if not existing
const createAdmin = async () => {
  try {
    const existingAdmin = await userModel.findOne({ role: 'admin' });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      const admin = await userModel.create({
        username: 'admin',
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
        password: hashedPassword,
        role: 'admin',
      });

      console.log('Admin created:', admin.username);
    } else {
      console.log('Admin already exists');
    }
  } catch (error) {
    console.error(' Error creating admin:', error.message);
  }
};

await createAdmin();

// Start server
const port = process.env.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
