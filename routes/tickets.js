// routes/tickets.js
import {Router} from 'express';
import { initiatePurchase, getMyTicketsAfterPayment,getAllMyTickets } from '../controllers/ticket.js';
import { isAuthenticated, authorizedRoles } from '../middlewares/auth.js';

const ticketRouter = Router();

ticketRouter.post('/purchase/initiate', isAuthenticated,authorizedRoles('attendee'), initiatePurchase);

// Attendee: Get tickets after successful payment using reference
ticketRouter.get('/attendee/tickets/after-payment',isAuthenticated,authorizedRoles('attendee'),getMyTicketsAfterPayment
);

// Attendee: Get all purchased tickets (printable anytime)
ticketRouter.get('/attendee/tickets/my',isAuthenticated,authorizedRoles('attendee'),getAllMyTickets);

export default ticketRouter;
