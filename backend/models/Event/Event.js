import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    event_id: { type: String,  unique: true },
    event_name: { type: String, required: true },
    event_date: { type: Date, required: true },
    event_description: { type: String },
    rulebook_drive_link: { type: String, required: true },
    event_poster: { type: String },
    event_coordinators: [
        {
            name: { type: String, required: true },
            contact: { type: String, required: true },
            email: { type: String, required: true },
            id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
        },
    ],
    event_catagory: {
        type: String,
        enum: ['Aurum', 'Verve', 'Olympus', 'Yuva'],
        required: true
    },
    event_slug: { type: String, required: true, unique: true },
    team_type: {
        type: String,
        enum: ["Individual", "Team"],
        required: true,
    },
    team_size: {
        type: Number,
        default: 1,
        required: true
    },
    event_type: {
        type: String,
        enum: ["Flagship", "Intra-college", "Inter-college", "Casual"],
        required: true,
    },
    registration_open: {
        type: Boolean,
        default: true
    },
    event_fee: {
        type: Number,
        default: 0
    },
    max_participants: {
        type: Number,
        default: null // null means unlimited
    },
    current_participants: {
        type: Number,
        default: 0
    },
    max_teams: {
        type: Number,
        default: null // null means unlimited
    },
    current_teams: {
        type: Number,
        default: 0
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin',
        required: true 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    // Winners info: for team events, store team name and id; for individual, store user name and id
    ,winners: [
        {
            // For team events
            team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
            team_name: { type: String, default: null },
            // For individual events
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            user_name: { type: String, default: null },
            // Common
            position: { type: String, enum: ['1st', '2nd', '3rd', 'Special'], default: '1st' }
        }
    ]
});

// Update the updatedAt field before saving
EventSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


const Event = mongoose.model("Event", EventSchema);

export default Event;