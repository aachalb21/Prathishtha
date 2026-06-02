import mongoose from 'mongoose';
import crypto from 'crypto';

const TeamSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  max_size: { type: Number, default: 0 },
  join_token: { type: String, unique: true, index: true },
  name: { type: String },
  isScanned: { type: Boolean, default: false },
  scannedAt: { type: Date },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

// Generate a short random join token before save if not present
TeamSchema.pre('save', function (next) {
  if (!this.join_token) {
    // Generate a short 8-character alphanumeric code (e.g., "A3B7X9K2")
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.join_token = token;
  }
  next();
});

const Team = mongoose.model('Team', TeamSchema);
export default Team;
