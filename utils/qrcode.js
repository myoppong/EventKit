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
    // Resize ticket base image to known width (optional)
    const baseImg = sharp(ticketImageBuffer).resize({ width: 1000 });
    const meta = await baseImg.metadata(); // Get dimensions
    const baseBuf = await baseImg.png().toBuffer();

    // Log background dimensions
    console.log('📐 Ticket background size:', meta.width, 'x', meta.height);

    // Dynamically set QR size based on base image size (20% of width)
    const qrSize = Math.floor(meta.width * 0.2);

    // Generate resized QR code
    const rawQR = await QRCode.toBuffer(
      ticketInstanceId.toString(),
      { errorCorrectionLevel: 'H', type: 'png' }
    );

    const qrCodeBuf = await sharp(rawQR)
      .resize(qrSize, qrSize)
      .toBuffer();

    // Log QR size
    const qrMeta = await sharp(qrCodeBuf).metadata();
    console.log('📐 QR code resized to:', qrMeta.width, 'x', qrMeta.height);

    // Build overlay text as SVG, sized to the base image
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

    // Composite QR and SVG onto ticket
    return await sharp(baseBuf)
      .composite([
        { input: qrCodeBuf, top: 50, left: 50 }, // Adjust QR position as needed
        { input: Buffer.from(svgText), top: 0, left: 0 }
      ])
      .png()
      .toBuffer();

  } catch (err) {
    console.error(' QR Code Generation Error:', err);
    return null;
  }
};



