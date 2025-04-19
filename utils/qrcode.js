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
    // Resize the base image first
    const resizedBaseImage = await sharp(ticketImageBuffer)
      .resize({ width: 1000 })
      .toBuffer();

    // Generate QR code buffer
    const qrCodeBuffer = await QRCode.toBuffer(ticketInstanceId.toString(), {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
    });

    // Process QR code buffer to ensure compatibility
    const processedQRCode = await sharp(qrCodeBuffer).png().toBuffer();

    // SVG Text Overlay
    const svgText = `
      <svg width="1000" height="500">
        <style>
          .label { font-size: 38px; font-family: Arial, sans-serif; fill: #000; font-weight: bold; }
        </style>
        <text x="50" y="400" class="label">Ticket #${ticketNumber}</text>
        <text x="50" y="450" class="label">Attendee: ${attendeeName}</text>
        <text x="50" y="500" class="label">Event: ${eventName}</text>
        <text x="50" y="550" class="label">Type: ${ticketType}</text>
        <text x="50" y="600" class="label">Date: ${eventDate}</text>
      </svg>
    `;

    // Composite QR code and text onto the resized base image
    const ticketWithQr = await sharp(resizedBaseImage)
      .composite([
        { input: processedQRCode, top: 50, left: 50 },
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

