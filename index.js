import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import payRouter from './routes/webhook.js';
import userRouter from './routes/user.js';
import { userModel } from './models/user.js';
import eventRouter from './routes/eventAndTicket.js';
import ticketRouter from './routes/tickets.js';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // ✅ allow frontend during dev
  credentials: true, // if you're sending cookies or headers like Authorization
}));


app.use(payRouter);


// ↑ Increase the default JSON/body-parser limit from 100kb → 10mb
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use(ticketRouter)
app.use(userRouter);
app.use(eventRouter)

// Connect to MongoDB
await mongoose.connect(process.env.db_URL);
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
