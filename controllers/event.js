import { eventModel } from "../models/event.js";
import { userModel } from "../models/user.js";
import { ticketModel } from "../models/ticket.js";
import { imagekit } from "../utils/imagekit.js";

// Create Event with Tickets

export const createEvent = async (req, res) => {
  try {
    const { files, body, auth } = req;

    if (!body.data) {
      return res.status(400).json({ message: "Missing event data" });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(body.data);
    } catch (parseErr) {
      return res.status(400).json({ message: "Invalid JSON in 'data' field" });
    }

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      type,
      category,
      socialLinks,
      registrationDeadline,
      allowAttendeeMessaging,
      refundPolicy,
      tickets,
    } = parsedData;

    const organizerId = auth.id; // Pass the organizer ID here
    
    const bannerFile = files?.banner?.[0];

    let bannerUrl = null;
    if (bannerFile) {
      const upload = await imagekit.upload({
        file: bannerFile.buffer,
        fileName: `event-banner-${Date.now()}`,
        folder: "/eventBanner",
      });
      bannerUrl = upload.url;
    }

    // Create the Event using the organizerId
    const event = await eventModel.create({
      organizer: organizerId, // organizer is now passed here
      title,
      description,
      location,
      startDate,
      endDate,
      type,
      category,
      socialLinks,
      registrationDeadline,
      allowMessaging: allowAttendeeMessaging,
      refundPolicy,
      bannerImage: bannerUrl,
    });

    
    // Handle ticket creation and image upload here
    const ticketDocs = await Promise.all(
      tickets.map(async (ticket, index) => {
        const imageFile = files?.[`ticketImage-${index}`]?.[0];
        let ticketImageUrl = null;
    
        if (imageFile) {
          const upload = await imagekit.upload({
            file: imageFile.buffer,
            fileName: `ticket-${ticket.type}-${Date.now()}`,
            folder: "/ticketImage",
          });
          ticketImageUrl = upload.url;
        }
    
        return await ticketModel.create({
          ...ticket,
          event: event.id,
          ticketImages: ticketImageUrl ? [ticketImageUrl] : [],
        });
      })
    );
    

    res.status(201).json({
      message: "Event created successfully",
      event,
      tickets: ticketDocs,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

  

export const publishEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await eventModel.findById(eventId).populate('organizer', 'username email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Optional: Make sure the user is the event's organizer
    if (req.auth.role === 'organizer' && event.organizer._id.toString() !== req.auth.id) {
      return res.status(403).json({ message: 'You are not the organizer of this event' });
    }

    // Update status
    event.status = 'published';
    await event.save();

    // Convert to object and format organizer
    const eventObj = event.toObject();
    if (eventObj.organizer && eventObj.organizer._id) {
      eventObj.organizer.id = eventObj.organizer._id.toString();
      delete eventObj.organizer._id;
    }

    res.status(200).json({ message: 'Event published successfully', event: eventObj });
  } catch (error) {
    console.error('Publish Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// controllers/event.js
export const previewEvent = async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.id)
      .populate('organizer', 'username email'); // Only pulling needed fields

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Ensure only the organizer can preview
    if (event.organizer.id.toString() !== req.auth.id) {
      return res.status(403).json({ message: 'You are not authorized to preview this event' });
    }

    const eventObj = event.toObject();
    if (eventObj.organizer && eventObj.organizer.id) {
      eventObj.organizer.id = eventObj.organizer.id.toString();
      delete eventObj.organizer.id;
    }

    res.status(200).json({ event: eventObj });
  } catch (error) {
    console.error('Preview Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




//  GET All Events
export const getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.find()
      .populate('organizer', 'username email'); // Fetches only username and email

    res.status(200).json({ events });
  } catch (error) {
    console.error('Get All Events Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


  
  // GET Single Event by ID

 export const getSingleEvent = async (req, res) => {
   try {
     const event = await eventModel.findById(req.params.id)
       .populate('organizer', 'username email');
 
     if (!event) {
       return res.status(404).json({ message: 'Event not found' });
     }
 
     // Find all ticket types associated with this event
     const tickets = await ticketModel.find({ event: event.id });
 
     const eventDetails = {
       id: event.id,
       title: event.title,
       description: event.description,
       bannerImage: event.bannerImage,
       category: event.category,
       location: event.location,
       isVirtual: event.isVirtual,
       type: event.type,
       startDate: event.startDate,
       endDate: event.endDate,
       registrationDeadline: event.registrationDeadline,
       refundPolicy: event.refundPolicy,
       allowMessaging: event.allowMessaging,
       socialLinks: event.socialLinks,
       status: event.status,
       createdAt: event.createdAt,
       updatedAt: event.updatedAt,
 
       // Organizer info
       organizer: {
         username: event.organizer?.username,
         email: event.organizer?.email,
       },
 
       // Tickets
       tickets: tickets.map(ticket => ({
         id: ticket.id,
         type: ticket.type,
         description: ticket.description,
         price: ticket.price,
         quantityAvailable: ticket.quantity - ticket.soldCount,
         ticketImages: ticket.ticketImages,
         discount: ticket.discount,
         customFields: ticket.customFields,
         soldCount: ticket.soldCount
       }))
     };
 
     res.status(200).json({ event: eventDetails });
   } catch (error) {
     console.error('Get Single Event Error:', error);
     res.status(500).json({ message: 'Internal server error' });
   }
 };
 
 export const getEventAttendeesPaginated = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const tickets = await ticketModel
      .find({ event: eventId })
      .populate('instances.buyer', 'name email')
      .lean();

    let attendees = [];

    tickets.forEach(ticket => {
      ticket.instances.forEach(inst => {
        if (inst.status === 'valid') {
          attendees.push({
            name: inst.buyer?.name,
            email: inst.buyer?.email,
            ticketType: ticket.type,
            ticketNumber: inst.ticketNumber,
            paymentStatus: 'Paid'
          });
        }
      });
    });

    const paginated = attendees.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      total: attendees.length,
      page: Number(page),
      perPage: Number(limit),
      attendees: paginated
    });

  } catch (err) {
    console.error('Error fetching paginated attendees:', err);
    res.status(500).json({ message: 'Failed to load attendees.' });
  }
};


// export const getMyEventsOverview = async (req, res) => {
//   try {
//     const organizerId = req.auth.id;

//     const events = await eventModel.find({ organizer: organizerId }).lean();

//     const allTickets = await ticketModel.find({ event: { $in: events.map(e => e._id) } }).lean();

//     const result = events.map(event => {
//       const ticketsForEvent = allTickets.filter(t => t.event.toString() === event._id.toString());

//       let sold = 0;
//       let total = 0;

//       ticketsForEvent.forEach(ticket => {
//         sold += ticket.instances.filter(inst => inst.status === 'valid').length;
//         total += ticket.instances.length;
//       });

//       return {
//         eventId: event._id,
//         title: event.title,
//         banner: event.bannerImage, // ✅ Corrected field
//         ticketsSold: sold,
//         ticketsLeft: total - sold
//       };
//     });

//     res.status(200).json({ events: result });

//   } catch (err) {
//     console.error('Error fetching event overview:', err);
//     res.status(500).json({ message: 'Failed to load events.' });
//   }
// };




// controllers/eventController.js

export const updateEvent = async (req, res) => {
  try {
    const { files, body, params, auth } = req;
    const { eventId } = params;

    if (!body.data) {
      return res.status(400).json({ message: "Missing event data" });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(body.data);
    } catch (parseErr) {
      return res.status(400).json({ message: "Invalid JSON in 'data' field" });
    }

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      type,
      category,
      socialLinks,
      registrationDeadline,
      allowAttendeeMessaging,
      refundPolicy,
      tickets, 
    } = parsedData;

    const bannerFile = files?.banner?.[0];

    let bannerUrl;
    if (bannerFile) {
      const upload = await imagekit.upload({
        file: bannerFile.buffer,
        fileName: `event-banner-${Date.now()}`,
        folder: "/eventBanner",
      });
      bannerUrl = upload.url;
    }

    const updatedEvent = await eventModel.findOneAndUpdate(
      { _id: eventId, organizer: auth.id },
      {
        title,
        description,
        location,
        startDate,
        endDate,
        type,
        category,
        socialLinks,
        registrationDeadline,
        allowMessaging: allowAttendeeMessaging,
        refundPolicy,
        ...(bannerUrl && { bannerImage: bannerUrl }),
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    //  Handle ticket updates
    let updatedTickets = [];
    if (tickets && Array.isArray(tickets)) {
      updatedTickets = await Promise.all(
        tickets.map(async (ticket, index) => {
          const imageFile = files?.[`ticketImage-${index}`]?.[0];
          let ticketImageUrl;

          if (imageFile) {
            const upload = await imagekit.upload({
              file: imageFile.buffer,
              fileName: `ticket-${ticket.type}-${Date.now()}`,
              folder: "/ticketImage",
            });
            ticketImageUrl = upload.url;
          }

          if (ticket.id) {
            //  Update existing ticket
            return await ticketModel.findOneAndUpdate(
              { id: ticket.id, event: eventId },
              {
                ...ticket,
                ...(ticketImageUrl && { ticketImages: [ticketImageUrl] }),
              },
              { new: true }
            );
          } else {
            //  Create new ticket
            return await ticketModel.create({
              ...ticket,
              event: eventId,
              ticketImages: ticketImageUrl ? [ticketImageUrl] : [],
            });
          }
        })
      );
    }

    res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
      tickets: updatedTickets,
    });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Server error updating event" });
  }
};



// controllers/event.js
export const getMyEventsOverview = async (req, res) => {
  try {
    const organizerId = req.auth.id;

    // 1. Fetch all events for this organizer
    const events = await eventModel.find({ organizer: organizerId }).lean();

    // 2. Fetch all ticket‐types for those events
    const ticketTypes = await ticketModel
      .find({ event: { $in: events.map(e => e._id) } })
      .lean();

    // 3. Build the overview
    const overview = events.map(evt => {
      // get only the ticket‐types for this event
      const typesForEvent = ticketTypes.filter(t => t.event.toString() === evt._id.toString());

      // sum soldCount and sum quantity across all types
      const ticketsSold = typesForEvent.reduce((sum, t) => sum + (t.soldCount || 0), 0);
      const totalAvailable = typesForEvent.reduce((sum, t) => sum + (t.quantity || 0), 0);

      return {
        eventId:      evt._id,
        title:        evt.title,
        banner:  evt.bannerImage,       // front‑end can use this as a background
        ticketsSold,                        
        ticketsLeft:  totalAvailable - ticketsSold
      };
    });

    res.status(200).json({ events: overview });
  } catch (err) {
    console.error("Error fetching event overview:", err);
    res.status(500).json({ message: "Failed to load events." });
  }
};




export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.auth.id;

    const event = await eventModel.findOneAndDelete({
      _id: eventId,
      organizer: organizerId,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    // Delete all related tickets
    await ticketModel.deleteMany({ event: eventId });

    res.status(200).json({ message: "Event and related tickets deleted successfully" });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ message: "Server error deleting event" });
  }
};