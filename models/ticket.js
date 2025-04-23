import { Schema, model } from 'mongoose';
import normalize from 'normalize-mongoose';

const ticketSchema = new Schema(
    {
        event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        type: { type: String, required: true }, // VIP, Regular, etc.
        description: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        soldCount: { type: Number, default: 0 },
        ticketImages: [{ type: String }], // Background image for the ticket

        // Discount options (optional)
        discount: {
            amount: Number,
            startDate: Date,
            endDate: Date
        },

        // Custom fields (optional)
        customFields: {
            type: [
              {
                label: String,
                type: {
                  type: String,
                  enum: ['text','select','checkbox'],
                  default: 'text'
                },
                options: [String]
              }
            ],
            default: []   // <-- default to empty array
          },
          

        // Instance specific fields (this is where we integrate the ticketInstance fields)
        instances: [
            {
                buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Who bought the ticket
                reference: { type: String, required: true },
                qrCode: { type: String, required: true }, // QR code of the ticket
                ticketNumber: { type: Number, required: true }, // Auto-incremented ticket number per ticket type
                customFieldResponses: [
                    {
                        label: String,
                        value: String
                    }
                ],
                status: {
                    type: String,
                    enum: ['valid', 'used', 'cancelled'],
                    default: 'valid'
                }
            }
        ]
    },
    { timestamps: true }
);

ticketSchema.plugin(normalize);

export const ticketModel = model('ticket', ticketSchema);
