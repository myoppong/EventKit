import {Router} from 'express';
import {createEvent,publishEvent,previewEvent,getAllEvents,getSingleEvent, updateEvent,
    deleteEvent,} from '../controllers/event.js';
import {isAuthenticated,authorizedRoles} from '../middlewares/auth.js';
import { uploadEventAssets } from "../middlewares/imageUpload.js";
import { getEventAttendeesPaginated, getMyEventsOverview } from '../controllers/event.js';

const eventRouter = Router();


// CREATE EVENT + TICKETS
eventRouter.post("/create-event",isAuthenticated,authorizedRoles("organizer"),uploadEventAssets,createEvent);
// routes/eventRoutes.js or wherever your routes are
eventRouter.patch('/events/:id/publish', isAuthenticated, authorizedRoles('organizer'), publishEvent);
// routes/eventRoutes.js
eventRouter.get('/events/:id/preview', isAuthenticated, authorizedRoles('organizer'), previewEvent);
eventRouter.get('/events', getAllEvents);
eventRouter.get('/events/:id', getSingleEvent);



// Organizer: View paginated list of attendees for a specific event
eventRouter.get('/organizer/event/:eventId/attendees',isAuthenticated,authorizedRoles('organizer'),getEventAttendeesPaginated);

// Organizer: Get overview of all events they own
eventRouter.get('/organizer/my-events/overview',isAuthenticated,authorizedRoles('organizer'),getMyEventsOverview
);

// Organizer: Update Event
eventRouter.put( '/organizer/event/:eventId',isAuthenticated,authorizedRoles('organizer'),uploadEventAssets,updateEvent
  );


  // Organizer: Delete Event
eventRouter.delete('/organizer/event/:eventId',isAuthenticated,authorizedRoles('organizer'),deleteEvent);


export default eventRouter;
