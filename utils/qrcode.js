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
import sharp  from 'sharp';

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
    // 1) Resize your ticket to a known width
    const baseImg = sharp(ticketImageBuffer).resize({ width: 1000 });
    const meta    = await baseImg.metadata();              // capture its dims
    const baseBuf = await baseImg.png().toBuffer();

    // 2) Generate a 300×300 QR code
    const qrCodeBuf = await QRCode.toBuffer(
      ticketInstanceId.toString(),
      { errorCorrectionLevel: 'H', type: 'png', width: 300 }
    );

    // 3) Build SVG sized to the base image exactly
    const svgText = `
      <svg width="${meta.width}" height="${meta.height}">
        <style>.label { font: bold 36px Arial; fill: #000; }</style>
        <text x="50"  y="${meta.height - 150}" class="label">Ticket #${ticketNumber}</text>
        <text x="50"  y="${meta.height - 100}" class="label">Attendee: ${attendeeName}</text>
        <text x="50"  y="${meta.height -  50}" class="label">Event: ${eventName}</text>
        <text x="${meta.width - 350}" y="${meta.height - 150}" class="label">Type: ${ticketType}</text>
        <text x="${meta.width - 350}" y="${meta.height - 100}" class="label">Date: ${eventDate}</text>
      </svg>
    `;

    // 4) Composite QR + SVG onto the resized base
    return await sharp(baseBuf)
      .composite([
        { input: qrCodeBuf,        top: 50, left: 50 },
        { input: Buffer.from(svgText), top: 0, left: 0 }
      ])
      .png()
      .toBuffer();

  } catch (err) {
    console.error('QR Code Generation Error:', err);
    return null;
  }
};


