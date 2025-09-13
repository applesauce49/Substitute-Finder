import { Schema } from "mongoose";

const SubRequest = new Schema({
    calendarId: String,
    gcalEventId: String,
    iCalUID: String,
    instanceStart: Date,
    role: {type: String, enum: ["host", "cohost"] },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    requestedAt: { type: Date, default: Date.now },

    // assignment
    substituteUser: { type: Schema.Types.ObjectId, ref: "User" },
    substituteEmail: String,
    status: { type: String, enaum: ["open", "offered", "assigned", "declined", "canceled"], default: "open" },

    // audit
    activity: [{
        at: Date,
        action: String,
        by: {type: Schema.Types.ObjectId, ref: "User" },
        meta: Schema.Types.Mixed
    }]
});

