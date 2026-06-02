import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    // Transaction identifiers
    transactionId: { type: String, unique: true, sparse: true }, // Our internal transaction ID
    orderId: { type: String, required: true, index: true }, // Our order ID
    bdOrderId: { type: String }, // BillDesk order ID if different
    bdTransactionId: { type: String }, // BillDesk transaction ID from payment response
    
    // References (optional for Zaikaa which doesn't have users/events)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    
    // Source identifier (to distinguish Prathistha vs Zaikaa transactions)
    source: { type: String, enum: ['prathistha', 'zaikaa'], default: 'prathistha' },
    
    // Zaikaa-specific fields
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    orderItems: { type: mongoose.Schema.Types.Mixed }, // Store cart items for Zaikaa
    shopIds: [{ type: String }],
    
    // Amount details
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    
    // Transaction status
    status: { 
        type: String, 
        enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUND_INITIATED', 'REFUNDED', 'CANCELLED'], 
        default: 'INITIATED',
        index: true
    },
    
    // BillDesk specific fields
    paymentMethod: { type: String }, // UPI, CARD, NETBANKING, WALLET
    paymentMethodDetails: {
        cardType: { type: String }, // CREDIT, DEBIT
        cardNetwork: { type: String }, // VISA, MASTERCARD, RUPAY
        bankName: { type: String },
        upiId: { type: String },
        walletName: { type: String }
    },
    
    // BillDesk response codes
    authStatus: { type: String }, // 0300 = Success
    errorCode: { type: String },
    errorDescription: { type: String },
    bdTraceId: { type: String }, // BillDesk trace ID
    errorMessage: { type: String },
    
    // Raw response storage (for debugging/reconciliation)
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
    
    // Timestamps
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failedAt: { type: Date },
    
    // Additional info
    ipAddress: { type: String },
    userAgent: { type: String },
    remarks: { type: String }
    
}, { timestamps: true });

// Indexes for faster queries
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ eventId: 1 });
transactionSchema.index({ source: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for checking if transaction is successful
transactionSchema.virtual('isSuccessful').get(function() {
    return this.status === 'SUCCESS';
});

// Static method to get transaction summary
transactionSchema.statics.getSummary = async function(filters = {}) {
    const match = {};
    if (filters.startDate) match.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) match.createdAt = { ...match.createdAt, $lte: new Date(filters.endDate) };
    if (filters.status) match.status = filters.status;
    if (filters.eventId) match.eventId = new mongoose.Types.ObjectId(filters.eventId);

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
