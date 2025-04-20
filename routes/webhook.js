import { Router }    from 'express';
import express       from 'express';
import crypto        from 'crypto';
import { ticketModel } from '../models/ticket.js';
import { generateQRCode } from '../utils/qrcode.js';
import { imagekit }      from '../utils/imagekit.js';

const payRouter = Router();

payRouter.post(
  '/paystack/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      // verify signature…
      const event = JSON.parse(req.body);
      if (event.event !== 'charge.success') {
        return res.status(200).send('Ignored');
      }

      const { metadata, reference } = event.data;
      const ticket = await ticketModel
        .findById(metadata.ticketId)
        .populate('event')
        .populate('instances.buyer');

      if (!ticket) return res.status(404).send('Ticket not found');

      // null‑safe already‑issued check
      if (ticket.instances.some(i => i.reference?.startsWith(reference))) {
        return res.status(200).send('Tickets already issued');
      }

      const quantity = metadata.quantity || 1;
      const newInstances = [];

      // Pre‑resize background once:
      const bgResponse = await fetch(ticket.ticketImages[0]);
      const bgBuf      = Buffer.from(await bgResponse.arrayBuffer());

      // for (let i = 0; i < quantity; i++) {
      //   const ticketNumber = ++ticket.soldCount;
      //   const ref          = `${reference}-${i+1}`;
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = ++ticket.soldCount;
        const ref = `${reference}-${i + 1}`;
        console.log("Generated reference for ticket instance:", ref);
      
        const qrBuf = await generateQRCode(
          ticket.id,
          bgBuf,
          ticketNumber,
          metadata.attendeeName || 'Attendee',
          ticket.event.title,
          ticket.type,
          new Date(ticket.event.startDate).toLocaleDateString()
        );
      
        if (!qrBuf) {
          console.error('Failed to composite QR for instance', i);
          continue;
        }
      
        const uploadRes = await imagekit.upload({
          file: qrBuf,
          fileName: `ticket-${ticket.type}-${Date.now()}-${i + 1}.png`,
          folder: '/finalTicket'
        });
      
        newInstances.push({
          buyer: metadata.userId,
          ticketNumber,
          reference: ref,
          customFieldResponses: metadata.customFieldResponses || [],
          qrCode: uploadRes.url,
          status: 'valid'
        });
      }
      

      ticket.instances.push(...newInstances);
      await ticket.save();
      res.status(200).send('Tickets issued');
      console.log('Ticket instances after push:', ticket.instances);


    } catch (err) {
      console.error('Webhook Error:', err);
      res.status(500).send('Webhook processing failed');
    }
  }
);

export default payRouter;




