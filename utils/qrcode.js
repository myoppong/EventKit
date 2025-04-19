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
    // 1) scale the ticket background to a known size
    const base = await sharp(ticketImageBuffer)
      .resize({ width: 1000 })   // pick a width that covers all your tickets
      .toBuffer();

    // 2) generate a 300×300 QR buffer
    const qrCodeBuffer = await QRCode.toBuffer(
      ticketInstanceId.toString(),
      { errorCorrectionLevel: 'H', type: 'png', width: 300 }
    );

    // 3) composite QR and text in one go
    const svgText = `
      <svg width="1000" height="600">
        <style>.label{font: bold 36px Arial; fill:#000}</style>
        <text x="50"  y="450" class="label">Ticket #${ticketNumber}</text>
        <text x="50"  y="500" class="label">Attendee: ${attendeeName}</text>
        <text x="50"  y="550" class="label">Event: ${eventName}</text>
        <text x="600" y="450" class="label">Type: ${ticketType}</text>
        <text x="600" y="500" class="label">Date: ${eventDate}</text>
      </svg>
    `;

    const out = await sharp(base)
      .composite([
        { input: qrCodeBuffer, top: 50, left: 50 },
        { input: Buffer.from(svgText), top: 0, left: 0 }
      ])
      .png()
      .toBuffer();

    return out;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    return null;
  }
};


