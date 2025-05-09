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
  attendeeName, // Unused
  eventName,    // Unused
  ticketType,
  eventDate
) => {
  try {
    // Resize ticket image
    const resizedBase = sharp(ticketImageBuffer).resize({ width: 1000 });
    const baseBuf = await resizedBase.png().toBuffer();
    const meta = await sharp(baseBuf).metadata();

    console.log(' Ticket background size:', meta.width, 'x', meta.height);

    // Generate QR Code
    const qrSize = Math.floor(meta.width * 0.2);
    const rawQR = await QRCode.toBuffer(ticketInstanceId.toString(), {
      errorCorrectionLevel: 'H',
      type: 'png',
    });

    const qrCodeBuf = await sharp(rawQR).resize(qrSize, qrSize).toBuffer();
    const qrMeta = await sharp(qrCodeBuf).metadata();
    console.log(' QR code resized to:', qrMeta.width, 'x', qrMeta.height);

    // Position QR bottom-right
    const padding = 50;
    const qrX = meta.width - qrMeta.width - padding;
    const qrY = meta.height - qrMeta.height - padding + 10;

    // SVG Text with new line structure
    const svgText = `
      <svg width="${meta.width}" height="${meta.height}">
        <style>.label { font: bold 36px Arial; fill: #000; }</style>
        <text x="50" y="${meta.height - 180}" class="label">Ticket #${ticketNumber}</text>
        <text x="50" y="${meta.height - 130}" class="label">Type: ${ticketType}</text>
        <text x="50" y="${meta.height - 80}" class="label">Date: ${eventDate}</text>
      </svg>
    `;

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







