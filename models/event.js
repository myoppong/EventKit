import { Schema, model } from 'mongoose';
import normalize from 'normalize-mongoose';

const eventSchema = new Schema(
    {
        organizer: {
            type: Schema.Types.ObjectId,
            ref: 'User', 
            required: true
        },
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        location: { type: String, required: true },
        isVirtual: { type: Boolean, default: false },
        type: {
            type: String,
            enum: ['Conference', 'Concert', 'Festival', 'Webinar', 'Other'],
            required: true,
        },
        bannerImage: { type: String },
        category: { type: String }, // e.g. Music, Education, etc.
        socialLinks: {
            facebook: String,
            instagram: String,
            twitter: String,
        },
        registrationDeadline: { type: Date },
        allowMessaging: { type: Boolean, default: false },
        refundPolicy: { type: String },
        status: {
            type: String,
            enum: ['draft', 'published', 'cancelled'],
            default: 'draft'
        }
    },
    { timestamps: true }
);

eventSchema.plugin(normalize);

export const eventModel = model('Event', eventSchema);
