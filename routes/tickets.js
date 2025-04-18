// routes/tickets.js
import {Router} from 'express';
import { initiatePurchase } from '../controllers/ticket.js';
import { isAuthenticated } from '../middlewares/auth.js';

const ticketRouter = Router();

ticketRouter.post('/purchase/initiate', isAuthenticated, initiatePurchase);

export default ticketRouter;
