import { Schema, model } from "mongoose";

const appointmentSchema = Schema({
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['CREATED', 'ACCEPTED', 'CANCELLED', 'COMPLETED'],
        default: 'CREATED',
        required: true,
    },
    pet: {
        type: Schema.ObjectId,
        ref: 'Pet',
        required: true,
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});

appointmentSchema.index({ pet: 1, date: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['CREATED', 'ACCEPTED'] } } });
appointmentSchema.index({ user: 1, date: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['CREATED', 'ACCEPTED'] } } });
export default model('Appointment', appointmentSchema);
