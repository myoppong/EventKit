// routes/tickets.js
import {Router} from 'express';
import { initiatePurchase } from '../controllers/ticket.js';
import { isAuthenticated, authorizedRoles } from '../middlewares/auth.js';

const ticketRouter = Router();

ticketRouter.post('/purchase/initiate', isAuthenticated,authorizedRoles('attendee'), initiatePurchase);

export default ticketRouter;
