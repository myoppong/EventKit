import {Router} from 'express';
import {createEvent,publishEvent,previewEvent,getAllEvents,getSingleEvent} from '../controllers/event.js';
import {isAuthenticated,authorizedRoles} from '../middlewares/auth.js';
import { uploadEventAssets } from "../middlewares/imageUpload.js";

const eventRouter = Router();


// CREATE EVENT + TICKETS
eventRouter.post("/create-event",isAuthenticated,authorizedRoles("organizer"),uploadEventAssets,createEvent);
// routes/eventRoutes.js or wherever your routes are
eventRouter.patch('/events/:id/publish', isAuthenticated, authorizedRoles('organizer'), publishEvent);
// routes/eventRoutes.js
eventRouter.get('/events/:id/preview', isAuthenticated, authorizedRoles('organizer'), previewEvent);
eventRouter.get('/events', getAllEvents);
eventRouter.get('/events/:id', getSingleEvent);




export default eventRouter;
