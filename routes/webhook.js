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

      for (let i = 0; i < quantity; i++) {
        const ticketNumber = ticket.soldCount + 1;
        ticket.soldCount = ticketNumber;

        const newInstance = {
          buyer: metadata.userId,
          ticketNumber,
          reference: `${reference}-${i + 1}`, // Unique reference per ticket
          customFieldResponses: metadata.customFieldResponses || [],
          qrCode: '',
          status: 'valid',
        };

        ticket.instances.push(newInstance);
      }

      await ticket.save();

      // Generate QR codes and upload images for each ticket instance
      for (let i = 0; i < quantity; i++) {
        const currentReference = `${reference}-${i + 1}`;
        const createdInstance = ticket.instances.find(
          (t) => t.reference === currentReference
        );

        if (!createdInstance) continue;

        // Get detailed info
        const attendeeName = createdInstance?.buyer?.name || 'Attendee';
        const eventName = ticket.event?.title || 'Event';
        const eventDate = ticket.event?.date
          ? new Date(ticket.event.date).toLocaleDateString('en-US', {
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
          createdInstance.id,
          ticketImageBuffer,
          createdInstance.ticketNumber,
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

        createdInstance.qrCode = upload.url;
      }

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




