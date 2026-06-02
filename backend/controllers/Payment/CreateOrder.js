import Order from '../../models/Payment/order.js';
import ZaikaaOrder from '../../models/Payment/ZaikaaOrder.js';
import Transaction from '../../models/Payment/Transaction.js';
import Event from '../../models/Event/Event.js';
import User from '../../models/User/Users.js';
import billDeskUtil from '../../utils/billdesk.js';
import { auditLogger } from '../../utils/auditLogger.js';
import { createOrder, createOrderPayload } from '../../utils/Payment_Utils/billdesk.js';
import { decryptPayload, verifyJwsPayload } from '../../utils/Payment_Utils/DecryptPayload.js';
import crypto from 'crypto';
/**
 * Create a new payment order for BillDesk
 * POST /api/payment/create-order
 */
export const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        // Validate BillDesk configuration
        try {
            billDeskUtil.validateConfig();
        } catch (configError) {
            auditLogger.error('BillDesk config error', configError, { orderId, userId });
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not configured properly',
                code: 'PAYMENT_CONFIG_ERROR'
            });
        }

        // Find the order
        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check order status
        if (order.status === 'PAID') {
            return res.status(400).json({ success: false, message: 'Order already paid' });
        }

        if (order.status === 'FAILED') {
            return res.status(400).json({ success: false, message: 'Order has failed. Please create a new registration.' });
        }

        // Get user and event details
        const [user, event] = await Promise.all([
            User.findById(userId),
            Event.findById(order.eventId)
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Generate return URL
        const returnUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/payments/response`;

        // Create BillDesk order payload
        const orderPayload = createOrderPayload({
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency || '356', // Default to INR
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: user.phone || '',
            returnUrl: returnUrl,
            additionalInfo: {
                eventId: event._id.toString(),
                eventName: event.event_name,
                userId: userId,
                teamId: order.teamId?.toString() || '',
                ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || ''
            }
        });

        // Create transaction record for tracking
        const transaction = new Transaction({
            transactionId: `TXN_${order.orderId}_${Date.now()}`,
            orderId: order.orderId,
            bdOrderId: order.orderId,
            userId: userId,
            eventId: order.eventId,
            teamId: order.teamId,
            amount: order.amount,
            currency: order.currency || 'INR',
            status: 'INITIATED',
            requestPayload: orderPayload,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || '',
            initiatedAt: new Date()
        });
        await transaction.save();

        // Log payment initiation
        auditLogger.payment.paymentInitiated(req, order.orderId, transaction.transactionId, order.amount);

        // Make API call to BillDesk to create order and get redirect URL
        let billDeskResponse;
        try {
            billDeskResponse = await billDeskUtil.createOrder(orderPayload);
        } catch (bdError) {
            console.error('BillDesk API error:', bdError);
            transaction.status = 'FAILED';
            transaction.errorMessage = bdError.message;
            await transaction.save();
            
            order.status = 'FAILED';
            order.failureReason = bdError.message;
            await order.save();

            return res.status(502).json({
                success: false,
                message: 'Payment gateway error. Please try again.',
                code: 'BILLDESK_API_ERROR',
                error: process.env.NODE_ENV === 'development' ? bdError.message : undefined
            });
        }

        // Update order with BillDesk order ID
        order.status = 'PENDING';
        order.bdOrderId = billDeskResponse.data.bdorderid || billDeskResponse.data.orderid || order.orderId;
        await order.save();

        // Update transaction with BillDesk response
        transaction.bdOrderId = order.bdOrderId;
        transaction.bdTraceId = billDeskResponse.traceId;
        await transaction.save();

        // Get the redirect URL from BillDesk response
        console.log('Decoded BillDesk response:', billDeskResponse.data);
        const redirectLink = billDeskResponse.data.links?.find(link => link.rel === 'redirect');
        const redirectUrl = redirectLink?.href;
        // BillDesk expects transaction_request to be POSTed to redirectUrl
        console.log('BillDesk redirect link parameters:', redirectLink?.parameters);
        const {
            merchantid,
            bdorderid,
            rdata
        } = redirectLink?.parameters || {};


        console.log('BillDesk redirect URL:', redirectUrl);
        if (!redirectUrl) {
            console.error('No redirect URL in BillDesk response:', billDeskResponse.data);
            return res.status(502).json({
                success: false,
                message: 'Invalid response from payment gateway',
                code: 'BILLDESK_NO_REDIRECT'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment order created',
            data: {
                orderId: order.orderId,
                bdOrderId: order.bdOrderId,
                transactionId: transaction.transactionId,
                amount: order.amount,
                currency: order.currency,

                // ✅ REQUIRED FOR REDIRECTION
                merchantid:process.env.BILLDESK_MERCHANT_ID,
                bdorderid,
                rdata,

                // optional (mostly constant)
                redirectUrl,

                eventName: event.event_name,
                customerName: user.name,
                customerEmail: user.email
            }
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        return res.status(500).json({
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// This Create order endpoint is for zaikaa 

export const createPaymentOrderZaikaa = async (req, res) => {
    try {
        const { order_id, selected_items, user_name, user_email, user_phone, total_amount, shop_ids } = req.body;
        console.log('Received createPaymentOrderZaikaa request with data:', { order_id, selected_items, user_name, user_email, user_phone, shop_ids });

        if (!order_id || !selected_items || !user_name || !user_email || !total_amount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if order already exists
        const existingOrder = await ZaikaaOrder.findOne({ orderId: order_id });
        if (existingOrder) {
            if (existingOrder.status === 'PAID') {
                return res.status(400).json({ success: false, message: 'Order already paid' });
            }
            // If order exists but not paid, we can reuse it
        }

        // Validate BillDesk configuration
        try {
            billDeskUtil.validateConfig();
        } catch (configError) {
            console.error('BillDesk config error:', configError);
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not configured properly',
                code: 'PAYMENT_CONFIG_ERROR'
            });
        }

        // Create or update Zaikaa order in database
        const zaikaaOrder = existingOrder || new ZaikaaOrder({
            orderId: order_id,
            customerName: user_name,
            customerEmail: user_email,
            customerPhone: user_phone || '',
            items: selected_items.map(item => ({
                item_name: item.item_name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                shop_id: item.shop_id || ''
            })),
            shopIds: shop_ids || [],
            totalAmount: parseFloat(total_amount),
            currency: 'INR',
            status: 'CREATED',
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || '',
            source: 'zaikaa'
        });

        // If existing order, update the details
        if (existingOrder) {
            existingOrder.customerName = user_name;
            existingOrder.customerEmail = user_email;
            existingOrder.customerPhone = user_phone || '';
            existingOrder.items = selected_items.map(item => ({
                item_name: item.item_name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                shop_id: item.shop_id || ''
            }));
            existingOrder.shopIds = shop_ids || [];
            existingOrder.totalAmount = parseFloat(total_amount);
            existingOrder.status = 'CREATED';
        }

        await zaikaaOrder.save();
        console.log('Zaikaa order saved:', zaikaaOrder.orderId);

        // Generate return URL for Zaikaa
        const returnUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/payments/response-zaikaa`;

        // Create BillDesk order payload
        const orderPayload = createOrderPayload({
            orderId: order_id,
            amount: total_amount,
            currency: '356', // INR
            customerName: user_name,
            customerEmail: user_email,
            customerPhone: user_phone || '',
            returnUrl: returnUrl,
            additionalInfo: {
                source: 'zaikaa',
                shopIds: shop_ids?.join(',') || '',
                itemCount: selected_items.length,
                ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || ''
            }
        });



        // Create transaction record for tracking (Zaikaa doesn't have userId/eventId)
        const transaction = new Transaction({
            transactionId: `TXN_ZAIKAA_${order_id}_${Date.now()}`,
            orderId: order_id,
            bdOrderId: order_id,
            amount: total_amount,
            currency: 'INR',
            status: 'INITIATED',
            source: 'zaikaa',
            customerName: user_name,
            customerEmail: user_email,
            customerPhone: user_phone,
            orderItems: selected_items,
            shopIds: shop_ids,
            requestPayload: orderPayload,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            userAgent: req.headers['user-agent'] || '',
            initiatedAt: new Date()
        });
        await transaction.save();

        // Make API call to BillDesk to create order and get redirect URL
        let billDeskResponse;
        try {
            billDeskResponse = await billDeskUtil.createOrder(orderPayload);
        } catch (bdError) {
            console.error('BillDesk API error:', bdError);
            transaction.status = 'FAILED';
            transaction.errorMessage = bdError.message;
            await transaction.save();

            // Update Zaikaa order status to FAILED
            zaikaaOrder.status = 'FAILED';
            zaikaaOrder.failureReason = bdError.message;
            zaikaaOrder.failedAt = new Date();
            await zaikaaOrder.save();

            return res.status(502).json({
                success: false,
                message: 'Payment gateway error. Please try again.',
                code: 'BILLDESK_API_ERROR',
                error: process.env.NODE_ENV === 'development' ? bdError.message : undefined
            });
        }

        // Update transaction with BillDesk response
        transaction.bdOrderId = billDeskResponse.data.bdorderid || billDeskResponse.data.orderid || order_id;
        transaction.bdTraceId = billDeskResponse.traceId;
        await transaction.save();

        // Update Zaikaa order with BillDesk order ID and set to PENDING
        zaikaaOrder.bdOrderId = transaction.bdOrderId;
        zaikaaOrder.transactionId = transaction.transactionId;
        zaikaaOrder.status = 'PENDING';
        await zaikaaOrder.save();
        console.log('Zaikaa order updated to PENDING:', zaikaaOrder.orderId);

        // Get the redirect URL from BillDesk response
        console.log('Decoded BillDesk response for Zaikaa:', billDeskResponse.data);
        const redirectLink = billDeskResponse.data.links?.find(link => link.rel === 'redirect');
        const redirectUrl = redirectLink?.href;

        const { merchantid, bdorderid, rdata } = redirectLink?.parameters || {};

        console.log('BillDesk redirect URL for Zaikaa:', redirectUrl);
        if (!redirectUrl) {
            console.error('No redirect URL in BillDesk response:', billDeskResponse.data);
            return res.status(502).json({
                success: false,
                message: 'Invalid response from payment gateway',
                code: 'BILLDESK_NO_REDIRECT'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment order created',
            data: {
                order_id,
                bdOrderId: transaction.bdOrderId,
                transactionId: transaction.transactionId,
                amount: total_amount,
                currency: 'INR',

                // Required for BillDesk redirection
                merchantid: process.env.BILLDESK_MERCHANT_ID,
                bdorderid,
                rdata,
                redirectUrl,

                // Order details
                user_name,
                user_email,
                user_phone,
                selected_items,
                shop_ids
            }
        });

    } catch (error) {
        console.error('Error in createPaymentOrderZaikaa:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Serve an auto-submit form that posts transaction_request to BillDesk (avoids missing content-type)


export const forwardToBillDesk = async (req, res) => {
  try {
    const { merchantid, bdorderid, rdata,} = req.query;
    console.log('Forwarding to BillDesk with params:', { merchantid, bdorderid, rdata });

    if (!merchantid || !bdorderid || !rdata ) {
      return res.status(400).send(`
        <h2>Missing payment parameters</h2>
        <p>Please try again.</p>
      `);
    }
    
    const redirectUrl = process.env.BILLDESK_REDIRECT_URL || 'https://pay.billdesk.com/web/v1_2/embeddedsdk'

    

    const billDeskEndpoint =
      redirectUrl;

    // ✅ Generate CSP nonce
    const nonce = crypto.randomBytes(16).toString('base64');

    // ✅ Set CSP header
    res.setHeader(
      'Content-Security-Policy',
      `script-src 'self' 'nonce-${nonce}'`
    );
    res.setHeader('Content-Type', 'text/html');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to BillDesk</title>
</head>
<body>
  <form id="sdklaunch" method="POST" action="${billDeskEndpoint}">
    <input type="hidden" name="merchantid" value="${merchantid}" />
    <input type="hidden" name="bdorderid" value="${bdorderid}" />
    <input type="hidden" name="rdata" value="${rdata}" />
  </form>

  <p>Redirecting to payment gateway...</p>

  <!-- ✅ NONCE ADDED -->
  <script nonce="${nonce}">
    document.getElementById('sdklaunch').submit();
  </script>
</body>
</html>
`;

    return res.status(200).send(html);
  } catch (error) {
    console.error('Error in forwardToBillDesk:', error);
    return res.status(500).send('<h2>Payment redirection failed</h2>');
  }
};


/**
 * Get order status
 * GET /api/payment/order/:orderId
 */
export const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const order = await Order.findOne({ orderId, userId })
            .populate('eventId', 'event_name event_slug event_fee')
            .populate('teamId', 'name join_token');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({
            success: true,
            order: {
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency,
                status: order.status,
                event: order.eventId ? {
                    name: order.eventId.event_name,
                    slug: order.eventId.event_slug,
                    fee: order.eventId.event_fee
                } : null,
                team: order.teamId ? {
                    name: order.teamId.name,
                    joinToken: order.teamId.join_token
                } : null,
                transactionId: order.transactionId,
                paidAt: order.paidAt,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        console.error('Error getting order status:', error);
        return res.status(500).json({ message: 'Failed to get order status' });
    }
};

/**
 * Get user's payment history
 * GET /api/payment/history
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const orders = await Order.find({ userId })
            .populate('eventId', 'event_name event_slug')
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            orders: orders.map(order => ({
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency,
                status: order.status,
                eventName: order.eventId?.event_name || 'Unknown Event',
                transactionId: order.transactionId,
                paidAt: order.paidAt,
                createdAt: order.createdAt
            }))
        });

    } catch (error) {
        console.error('Error getting payment history:', error);
        return res.status(500).json({ message: 'Failed to get payment history' });
    }
};

/**
 * Retry failed payment
 * POST /api/payment/retry
 */
export const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Only allow retry for CREATED or FAILED orders
        if (!['CREATED', 'FAILED'].includes(order.status)) {
            return res.status(400).json({
                message: `Cannot retry order with status: ${order.status}`
            });
        }

        // Reset order status to CREATED for retry
        order.status = 'CREATED';
        order.failedAt = null;
        order.failureReason = null;
        await order.save();

        // Return to create-order flow
        return res.status(200).json({
            success: true,
            message: 'Order ready for retry',
            orderId: order.orderId
        });

    } catch (error) {
        console.error('Error retrying payment:', error);
        return res.status(500).json({ message: 'Failed to retry payment' });
    }
};

/**
 * Get all transactions (Admin only)
 * GET /api/payment/transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

        // Build query
        const query = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('userId', 'name email phone')
                .populate('eventId', 'event_name event_slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Transaction.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            transactions: transactions.map(txn => ({
                transactionId: txn.transactionId,
                orderId: txn.orderId,
                bdOrderId: txn.bdOrderId,
                bdTransactionId: txn.bdTransactionId,
                bdTraceId: txn.bdTraceId,
                user: txn.userId ? {
                    name: txn.userId.name,
                    email: txn.userId.email,
                    phone: txn.userId.phone
                } : null,
                event: txn.eventId ? {
                    name: txn.eventId.event_name,
                    slug: txn.eventId.event_slug
                } : null,
                amount: txn.amount,
                currency: txn.currency,
                status: txn.status,
                paymentMethod: txn.paymentMethod,
                errorCode: txn.errorCode,
                errorDescription: txn.errorDescription,
                initiatedAt: txn.initiatedAt,
                completedAt: txn.completedAt,
                failedAt: txn.failedAt,
                createdAt: txn.createdAt
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting transactions:', error);
        return res.status(500).json({ message: 'Failed to get transactions' });
    }
};

/**
 * Get transaction details (Admin only)
 * GET /api/payment/transaction/:transactionId
 */
export const getTransactionDetails = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findOne({ transactionId })
            .populate('userId', 'name email phone')
            .populate('eventId', 'event_name event_slug event_fee')
            .populate('teamId', 'name join_token');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        return res.status(200).json({
            success: true,
            transaction: {
                transactionId: transaction.transactionId,
                orderId: transaction.orderId,
                bdOrderId: transaction.bdOrderId,
                bdTransactionId: transaction.bdTransactionId,
                user: transaction.userId ? {
                    id: transaction.userId._id,
                    name: transaction.userId.name,
                    email: transaction.userId.email,
                    phone: transaction.userId.phone
                } : null,
                event: transaction.eventId ? {
                    id: transaction.eventId._id,
                    name: transaction.eventId.event_name,
                    slug: transaction.eventId.event_slug,
                    fee: transaction.eventId.event_fee
                } : null,
                team: transaction.teamId ? {
                    id: transaction.teamId._id,
                    name: transaction.teamId.name,
                    joinToken: transaction.teamId.join_token
                } : null,
                amount: transaction.amount,
                currency: transaction.currency,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                paymentMethodDetails: transaction.paymentMethodDetails,
                authStatus: transaction.authStatus,
                txnProcessType: transaction.txnProcessType,
                errorCode: transaction.errorCode,
                errorDescription: transaction.errorDescription,
                requestPayload: transaction.requestPayload,
                responsePayload: transaction.responsePayload,
                ipAddress: transaction.ipAddress,
                userAgent: transaction.userAgent,
                initiatedAt: transaction.initiatedAt,
                completedAt: transaction.completedAt,
                failedAt: transaction.failedAt,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt
            }
        });

    } catch (error) {
        console.error('Error getting transaction details:', error);
        return res.status(500).json({ message: 'Failed to get transaction details' });
    }
};

/**
 * Get transaction summary/stats (Admin only)
 * GET /api/payment/transactions/summary
 */
export const getTransactionSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        const summary = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Format summary
        const formatted = {
            total: { count: 0, amount: 0 },
            success: { count: 0, amount: 0 },
            failed: { count: 0, amount: 0 },
            pending: { count: 0, amount: 0 },
            initiated: { count: 0, amount: 0 }
        };

        summary.forEach(item => {
            const key = item._id?.toLowerCase() || 'unknown';
            formatted.total.count += item.count;
            formatted.total.amount += item.totalAmount || 0;

            if (formatted[key]) {
                formatted[key].count = item.count;
                formatted[key].amount = item.totalAmount || 0;
            }
        });

        return res.status(200).json({
            success: true,
            summary: formatted,
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        });

    } catch (error) {
        console.error('Error getting transaction summary:', error);
        return res.status(500).json({ message: 'Failed to get transaction summary' });
    }
};
