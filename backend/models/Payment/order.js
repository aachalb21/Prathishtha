import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    teamName: { type: String, default: null }, // Store team name for creation after payment
    isTeamEvent: { type: Boolean, default: false }, // Flag to indicate if this is a team event
    amount: { type: Number, required: true },
    currency: { type: Number, default: 356 },
    status: { 
        type: String, 
        enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED','cancelled'], 
        default: 'CREATED' 
    },
    // BillDesk specific fields
    bdOrderId: { type: String }, // BillDesk order ID
    transactionId: { type: String }, // BillDesk transaction ID
    paymentMethod: { type: String },
    // Response data
    paymentResponse: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
}, { timestamps: true });

// Index for faster queries
orderSchema.index({ userId: 1, eventId: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;