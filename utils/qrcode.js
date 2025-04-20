// utils/qrcode.js

// export const generateQRCode = async (data) => {
//   try {
//     return await QRCode.toDataURL(data);
//   } catch (error) {
//     console.error("QR Code Generation Error:", error);
//     return null;
//   }
// };

import QRCode from 'qrcode';
import sharp from 'sharp';

export const generateQRCode = async (
  ticketInstanceId,
  ticketImageBuffer,
  ticketNumber,
  attendeeName,
  eventName,
  ticketType,
  eventDate
) => {
  try {
    // Step 1: Resize ticket image
    const resizedBase = sharp(ticketImageBuffer).resize({ width: 1000 });
    const baseBuf = await resizedBase.png().toBuffer();
    const meta = await sharp(baseBuf).metadata(); // Get accurate dimensions

    console.log('📐 Ticket background size:', meta.width, 'x', meta.height);

    // Step 2: Create QR code
    const qrSize = Math.floor(meta.width * 0.2);
    const rawQR = await QRCode.toBuffer(ticketInstanceId.toString(), {
      errorCorrectionLevel: 'H',
      type: 'png',
    });

    const qrCodeBuf = await sharp(rawQR).resize(qrSize, qrSize).toBuffer();
    const qrMeta = await sharp(qrCodeBuf).metadata();
    console.log('📐 QR code resized to:', qrMeta.width, 'x', qrMeta.height);

    // Step 3: Calculate positions
    const padding = 80;
    const qrX = meta.width - qrMeta.width - padding;
    const qrY = meta.height - qrMeta.height - padding;

    // Step 4: Adjust right-side text upward to avoid QR code
    const rightTextY = meta.height - qrMeta.height - 100;

    const svgText = `
      <svg width="${meta.width}" height="${meta.height}">
        <style>.label { font: bold 36px Arial; fill: #000; }</style>
        <text x="50" y="${meta.height - 150}" class="label">Ticket #${ticketNumber}</text>
        <text x="50" y="${meta.height - 100}" class="label">Attendee: ${attendeeName}</text>
        <text x="50" y="${meta.height - 50}"  class="label">Event: ${eventName}</text>
        <text x="${meta.width - 350}" y="${rightTextY}" class="label">Type: ${ticketType}</text>
        <text x="${meta.width - 350}" y="${rightTextY + 50}" class="label">Date: ${eventDate}</text>
      </svg>
    `;

    // Step 5: Composite all
    return await sharp(baseBuf)
      .composite([
        { input: qrCodeBuf, left: qrX, top: qrY },
        { input: Buffer.from(svgText), left: 0, top: 0 }
      ])
      .png()
      .toBuffer();

  } catch (err) {
    console.error(' QR Code Generation Error:', err);
    return null;
  }
};






