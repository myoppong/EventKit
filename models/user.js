import { Schema, model } from 'mongoose';
import normalize from 'normalize-mongoose';

const userSchema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['admin', 'organizer', 'attendee'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(normalize);


export const userModel = model("User", userSchema);