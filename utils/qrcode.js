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
    // 1) Resize your base ticket once up‑front
    const base = await sharp(ticketImageBuffer)
      .resize({ width: 1000 })
      .toBuffer();

    // 2) Generate a clean PNG QR code buffer
    const qrCodeBuffer = await QRCode.toBuffer(ticketInstanceId.toString(), {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
    });

    // 3) Prepare your SVG text overlay
    const svgText = `
      <svg width="1000" height="600">
        <style>
          .label { font-size: 36px; font-family: Arial, sans-serif; fill: #000; font-weight: bold; }
        </style>
        <text x="50"  y="450" class="label">Ticket #${ticketNumber}</text>
        <text x="50"  y="500" class="label">Attendee: ${attendeeName}</text>
        <text x="50"  y="550" class="label">Event: ${eventName}</text>
        <text x="600" y="450" class="label">Type: ${ticketType}</text>
        <text x="600" y="500" class="label">Date: ${eventDate}</text>
      </svg>
    `;

    // 4) Composite QR *then* text onto your resized base
    const ticketWithQr = await sharp(base)
      .composite([
        // QR on top-left
        { input: qrCodeBuffer, top: 50, left: 50 },
        // Text overlay
        { input: Buffer.from(svgText), top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    return ticketWithQr;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return null;
  }
};

