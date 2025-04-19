import {Router} from 'express';
import express from 'express';
import crypto from 'crypto';
import { ticketModel } from '../models/ticket.js';
import { eventModel } from '../models/event.js';
import { generateQRCode } from '../utils/qrcode.js';
import {imagekit} from '../utils/imagekit.js';

const payRouter = Router();
payRouter.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest('hex');

    const signature = req.headers['x-paystack-signature'];
    if (hash !== signature) return res.status(401).send('Invalid signature');

    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { metadata, reference } = event.data;
    
      const ticket = await ticketModel.findById(metadata.ticketId)
        .populate('event')
        .populate('instances.buyer');
    
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
      // Check if tickets have already been issued for this reference
      const alreadyIssued = ticket.instances.some((inst) => inst.reference.startsWith(reference));
      if (alreadyIssued) return res.status(200).send('Tickets already issued');
    
      const quantity = metadata.quantity || 1;
      const newInstances = [];
    
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = ticket.soldCount + 1;
        ticket.soldCount = ticketNumber;
    
        const currentReference = `${reference}-${i + 1}`;
    
        // Get detailed info
        const attendeeName = metadata.attendeeName || 'Attendee';
        const eventName = ticket.event?.title || 'Event';
        const eventDate = ticket.event?.startDate
          ? new Date(ticket.event.startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Date';
        const ticketType = ticket.type;
    
        // Download ticket image
        const ticketImageResponse = await fetch(ticket.ticketImages[0]);
        const ticketImageBuffer = Buffer.from(await ticketImageResponse.arrayBuffer());
    
        const qrOverlayBuffer = await generateQRCode(
          ticket.id,
          ticketImageBuffer,
          ticketNumber,
          attendeeName,
          eventName,
          ticketType,
          eventDate
        );
    
        const upload = await imagekit.upload({
          file: qrOverlayBuffer,
          fileName: `ticket-${ticket.type}-${Date.now()}-${i + 1}`,
          folder: '/finalTicket',
        });
    
        const newInstance = {
          buyer: metadata.userId,
          ticketNumber,
          reference: currentReference,
          customFieldResponses: metadata.customFieldResponses || [],
          qrCode: upload.url,
          status: 'valid',
        };
    
        newInstances.push(newInstance);
      }
    
      // Add all new instances to the ticket
      ticket.instances.push(...newInstances);
    
      await ticket.save();
    
      return res.status(200).send('Tickets issued');
    }
    

    res.status(200).send('Ignored');
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(500).send('Webhook processing failed');
  }
});

export default payRouter;




