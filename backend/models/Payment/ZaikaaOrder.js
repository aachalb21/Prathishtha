import mongoose from "mongoose";

const zaikaaOrderItemSchema = new mongoose.Schema({
    item_name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    shop_id: { type: String }
}, { _id: false });

const zaikaaOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    
    // Customer details
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    
    // Order details
    items: [zaikaaOrderItemSchema],
    shopIds: [{ type: String }],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    // Payment status
    status: { 
        type: String, 
        enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'], 
        default: 'CREATED' 
    },
    
    // BillDesk specific fields
    bdOrderId: { type: String },
    transactionId: { type: String },
    paymentMethod: { type: String },
    
    // Token for order tracking (like Zaika's tokenid)
    tokenId: { type: Number },
    
    // Response data
    paymentResponse: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    
    // Metadata
    ipAddress: { type: String },
    userAgent: { type: String },
    source: { type: String, default: 'zaikaa' }
}, { timestamps: true });

// Indexes
zaikaaOrderSchema.index({ orderId: 1 });
zaikaaOrderSchema.index({ customerEmail: 1 });
zaikaaOrderSchema.index({ status: 1 });
zaikaaOrderSchema.index({ createdAt: -1 });

const ZaikaaOrder = mongoose.model("ZaikaaOrder", zaikaaOrderSchema);

export default ZaikaaOrder;
