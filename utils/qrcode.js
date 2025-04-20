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
    const meta = await sharp(baseBuf).metadata(); // Accurate post-resize dimensions

    console.log('📐 Ticket background size:', meta.width, 'x', meta.height);

    // Step 2: Create QR code at 20% of width
    const qrSize = Math.floor(meta.width * 0.2);
    const rawQR = await QRCode.toBuffer(ticketInstanceId.toString(), {
      errorCorrectionLevel: 'H',
      type: 'png',
    });

    const qrCodeBuf = await sharp(rawQR).resize(qrSize, qrSize).toBuffer();
    const qrMeta = await sharp(qrCodeBuf).metadata();
    console.log('📐 QR code resized to:', qrMeta.width, 'x', qrMeta.height);

    // Step 3: Position QR code in bottom-right corner
    const qrX = meta.width - qrMeta.width - 50;
    const qrY = meta.height - qrMeta.height - 50;

    // Step 4: Create SVG for text
    const svgText = `
      <svg width="${meta.width}" height="${meta.height}">
        <style>.label { font: bold 36px Arial; fill: #000; }</style>
        <text x="50" y="${meta.height - 150}" class="label">Ticket #${ticketNumber}</text>
        <text x="50" y="${meta.height - 100}" class="label">Attendee: ${attendeeName}</text>
        <text x="50" y="${meta.height - 50}"  class="label">Event: ${eventName}</text>
        <text x="${meta.width - 350}" y="${meta.height - 150}" class="label">Type: ${ticketType}</text>
        <text x="${meta.width - 350}" y="${meta.height - 100}" class="label">Date: ${eventDate}</text>
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




