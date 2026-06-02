import Order from '../../models/Payment/order.js';
import ZaikaaOrder from '../../models/Payment/ZaikaaOrder.js';
import Transaction from '../../models/Payment/Transaction.js';
import Event from '../../models/Event/Event.js';
import User from '../../models/User/Users.js';
import Team from '../../models/Event/Team.js';
import billDeskUtil from '../../utils/billdesk.js';
import { auditLogger } from '../../utils/auditLogger.js';
import { decryptPayload, verifyJwsPayload } from '../../utils/Payment_Utils/DecryptPayload.js';
import { generateTeamQRBuffer } from '../../utils/qrGenerator.js';
import { sendTeamJoinEmail } from '../../utils/Email/SendTeamJoinEmail.js';

// BillDesk IP whitelist (add actual BillDesk IPs in production)
const BILLDESK_IPS = process.env.BILLDESK_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

/**
 * Verify request is from BillDesk (IP whitelist check)
 * In production, enable this by setting BILLDESK_ALLOWED_IPS env variable
 */
const verifyBillDeskIP = (req) => {
    if (BILLDESK_IPS.length === 0) {
        // IP whitelist not configured, skip check (development mode)
        return true;
    }
    const clientIP = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const isValid = BILLDESK_IPS.includes(clientIP);

    if (!isValid) {
        auditLogger.security.suspiciousActivity(req, 'INVALID_WEBHOOK_IP', {
            clientIP,
            allowedIPs: BILLDESK_IPS
        });
    }

    return isValid;
};

/**
 * Handle BillDesk payment response (Return URL)
 * This is called when BillDesk redirects back after payment
 * POST /api/payment/response
 */
export const handlePaymentResponse = async (req, res) => {
    try {
        auditLogger.payment.webhookReceived(req, 'BILLDESK_RESPONSE', req.body?.orderid || 'unknown');

        // BillDesk sends response as JWS token in 'encrypted_response' or sometimes inside txnResponse/transaction_response
        const responseBody = req.body || {};
        console.log("Received BillDesk Response:", JSON.stringify(responseBody));

        const pickJwsToken = (body) => {
            const directCandidates = [
                body?.encrypted_response,
                body?.transaction_response,
                body?.txnResponse,
                body?.txn_response
            ];

            // Helper to check if a string looks like a valid JWS token (3 base64url parts separated by dots)
            const isValidJws = (str) => {
                if (typeof str !== 'string') return false;
                const trimmed = str.trim();
                // JWS format: header.payload.signature (3 parts)
                const parts = trimmed.split('.');
                if (parts.length !== 3) return false;
                // Each part should be base64url encoded (no invalid chars like [object Object])
                const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
                return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
            };

            let token = directCandidates.find(v => isValidJws(v));

            if (!token) {
                const objCandidate = directCandidates.find(v => v && typeof v === 'object');
                if (objCandidate) {
                    const nestedCandidates = [
                        objCandidate.encrypted_response,
                        objCandidate.transaction_response,
                        objCandidate.jws,
                        objCandidate.token
                    ];
                    token = nestedCandidates.find(v => isValidJws(v));
                }
            }

            return token;
        };

        const encrypted_response = pickJwsToken(responseBody);
        
        // Log what we found for debugging
        console.log("Extracted JWS token:", encrypted_response ? `${encrypted_response.substring(0, 50)}...` : 'null');

        // Handle case where no valid JWS token is found (e.g., user terminated/cancelled transaction)
        if (!encrypted_response) {
            // BillDesk might send basic info directly for cancelled/terminated transactions
            const orderid = responseBody.orderid || responseBody.orderId || responseBody.order_id;
            const terminalState = responseBody.terminal_state || responseBody.terminalState;
            
            if (orderid) {
                console.log(`Transaction terminated/cancelled for order: ${orderid}, terminal_state: ${terminalState}`);
                auditLogger.warn('Transaction terminated/cancelled by user', { 
                    orderId: orderid, 
                    terminalState,
                    ip: req.ip,
                    keys: Object.keys(responseBody)
                });
                
                // Find and update the order as cancelled
                const order = await Order.findOne({ orderId: orderid });
                if (order) {
                    order.status = 'cancelled';
                    order.paymentDetails = {
                        ...order.paymentDetails,
                        terminalState,
                        cancelledAt: new Date(),
                        errorDescription: 'Transaction terminated by user'
                    };
                    await order.save();
                }
                
                return res.redirect(
                    `${process.env.FRONTEND_URL}/payment/cancelled?orderId=${orderid}&reason=user_terminated`
                );
            }
            
            auditLogger.error('No valid transaction response received', null, { ip: req.ip, keys: Object.keys(responseBody) });
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=no_response`);
        }

        // Verify and decode the JWS token (cryptographic verification)
        let payload;
        try {
            const jwe = await verifyJwsPayload(encrypted_response);

            // 2. Decrypt JWE → returns JSON string
            const decrypted = await decryptPayload(jwe);

            // 3. Parse JSON
            payload = JSON.parse(decrypted);
        } catch (cryptoError) {
            console.error('Crypto/decryption error:', cryptoError.message);
            auditLogger.error('Failed to decrypt/verify payment response', cryptoError, { 
                ip: req.ip,
                orderId: responseBody.orderid || responseBody.orderId
            });
            
            // If decryption fails, check if we have orderid to mark as failed
            const orderid = responseBody.orderid || responseBody.orderId || responseBody.order_id;
            if (orderid) {
                const order = await Order.findOne({ orderId: orderid });
                if (order) {
                    order.status = 'failed';
                    order.paymentDetails = {
                        ...order.paymentDetails,
                        failedAt: new Date(),
                        errorDescription: 'Failed to process payment response'
                    };
                    await order.save();
                }
            }
            
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=decryption_error&orderId=${orderid || ''}`);
        }

        if (!payload) {
            auditLogger.security.invalidSignature(req, 'BILLDESK_RESPONSE');
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=invalid_signature`);
        }
        console.log("Decrypted BillDesk Payload:", payload);
        auditLogger.info('Payment response payload received', { orderId: payload.orderid });

        const {
            orderid,
            transactionid,        // BillDesk sends 'transactionid' (no underscore)
            auth_status,          // BillDesk sends 'auth_status' not 'transaction_status'
            payment_method_type,
            transaction_error_code,
            transaction_error_desc
        } = payload;

        // Find the order
        const order = await Order.findOne({ orderId: orderid });

        if (!order) {
            auditLogger.warn('Order not found for payment response', { orderId: orderid });
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=order_not_found`);
        }

        // Process based on auth_status
        // BillDesk status codes: 0300 = Success, others = Failed
        if (auth_status === '0300') {
            // Payment successful
            await handleSuccessfulPayment(order, {
                transactionId: transactionid,
                paymentMethod: payment_method_type,
                response: payload
            }, req);

            return res.redirect(
                `${process.env.FRONTEND_URL}/payment/success?orderId=${orderid}&txnId=${transactionid}`
            );
        } else {
            // Payment failed
            await handleFailedPayment(order, {
                errorCode: transaction_error_code,
                errorDesc: transaction_error_desc,
                response: payload
            }, req);

            return res.redirect(
                `${process.env.FRONTEND_URL}/payment/failed?orderId=${orderid}&error=${encodeURIComponent(transaction_error_desc || 'Payment failed')}`
            );
        }

    } catch (error) {
        auditLogger.error('Error handling payment response', error, { ip: req.ip });
        console.error('Error handling payment response:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=server_error`);
    }
};

/**
 * Handle BillDesk webhook/callback (Server-to-Server)
 * This is a backup notification from BillDesk
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res) => {
    try {
        console.log('🔔 WEBHOOK RECEIVED');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        
        auditLogger.payment.webhookReceived(req, 'BILLDESK_WEBHOOK', req.body?.orderid || 'unknown');

        // Verify request is from BillDesk (IP whitelist)
        // Temporarily disabled for testing - enable in production with actual BillDesk IPs
        const verifyIp = process.env.VERIFY_WEBHOOK_IP === 'true';
        if (verifyIp && !verifyBillDeskIP(req)) {
            console.warn('⚠️ Invalid IP for webhook:', req.ip);
            auditLogger.security.unauthorizedAccess(req, 'webhook', 'Invalid IP');
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }

        const { encrypted_response, transaction_response } = req.body;
        const jws = encrypted_response || transaction_response;

        if (!jws) {
            console.warn('⚠️ No encrypted_response or transaction_response in webhook');
            return res.status(400).json({ status: 'error', message: 'No transaction response' });
        }

        console.log('✅ JWS/Encrypted response received, attempting decryption...');

        // Verify JWS token (cryptographic verification) and get JWE
        const jwe = await verifyJwsPayload(jws);

        if (!jwe) {
            auditLogger.security.invalidSignature(req, 'BILLDESK_WEBHOOK');
            return res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }

        // Decrypt JWE → returns JSON string
        const decrypted = await decryptPayload(jwe);

        // Parse JSON
        const payload = JSON.parse(decrypted);

        if (!payload) {
            auditLogger.security.invalidSignature(req, 'BILLDESK_WEBHOOK');
            return res.status(400).json({ status: 'error', message: 'Invalid payload' });
        }

        const { orderid, transactionid, auth_status } = payload;

        // Find the order
        const order = await Order.findOne({ orderId: orderid });

        if (!order) {
            auditLogger.warn('Order not found for webhook', { orderId: orderid });
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        // Skip if already processed
        if (order.status === 'PAID') {
            auditLogger.info('Webhook for already processed order', { orderId: orderid });
            return res.status(200).json({ status: 'ok', message: 'Already processed' });
        }

        // Process payment
        if (auth_status === '0300') {
            await handleSuccessfulPayment(order, {
                transactionId: transactionid,
                paymentMethod: payload.payment_method_type,
                response: payload
            }, req);
        } else {
            await handleFailedPayment(order, {
                errorCode: payload.transaction_error_code,
                errorDesc: payload.transaction_error_desc,
                response: payload
            }, req);
        }

        auditLogger.payment.webhookProcessed(req, orderid, auth_status === '0300' ? 'SUCCESS' : 'FAILED');
        return res.status(200).json({ status: 'ok', message: 'Webhook processed' });

    } catch (error) {
        auditLogger.error('Error handling webhook', error, { ip: req.ip });
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

/**
 * Handle successful payment
 * @param {Object} order - Order document
 * @param {Object} paymentData - Payment details
 * @param {Object} req - Request object for logging
 */
async function handleSuccessfulPayment(order, paymentData, req = null) {
    try {
        // Update order status
        order.status = 'PAID';
        order.transactionId = paymentData.transactionId;
        order.paymentMethod = paymentData.paymentMethod;
        order.paymentResponse = paymentData.response;
        order.paidAt = new Date();
        await order.save();

        // Update or create transaction record
        const transactionUpdate = {
            status: 'SUCCESS',
            bdTransactionId: paymentData.transactionId,
            paymentMethod: paymentData.paymentMethod || paymentData.response?.payment_method_type,
            paymentMethodDetails: {
                type: paymentData.response?.payment_method_type,
                bankCode: paymentData.response?.bank_id,
                bankName: paymentData.response?.bank_ref_no
            },
            responsePayload: paymentData.response,
            authStatus: paymentData.response?.auth_status,
            txnProcessType: paymentData.response?.txn_process_type,
            completedAt: new Date()
        };

        // Try to find existing transaction, or create new one
        const existingTxn = await Transaction.findOne({ orderId: order.orderId });
        if (existingTxn) {
            Object.assign(existingTxn, transactionUpdate);
            await existingTxn.save();
        } else {
            // Create new transaction record if doesn't exist
            const newTxn = new Transaction({
                transactionId: `TXN_${order.orderId}_${Date.now()}`,
                orderId: order.orderId,
                bdOrderId: paymentData.response?.bd_order_id || order.bdOrderId,
                userId: order.userId,
                eventId: order.eventId,
                teamId: order.teamId,
                amount: order.amount,
                currency: order.currency || 'INR',
                ...transactionUpdate
            });
            await newTxn.save();
        }

        // Get event and user
        const [event, user] = await Promise.all([
            Event.findById(order.eventId),
            User.findById(order.userId)
        ]);

        if (!event || !user) {
            auditLogger.error('Event or user not found for successful payment', null, {
                orderId: order.orderId,
                eventId: order.eventId,
                userId: order.userId
            });
            return;
        }

        // Log successful payment
        auditLogger.payment.paymentSuccess(
            req,
            order.orderId,
            existingTxn?.transactionId || 'unknown',
            order.amount,
            paymentData.transactionId
        );

        // Check if user is already registered (in case of webhook retry)
        const alreadyRegistered = user.Events_registered?.some(
            r => String(r.event_id) === String(event._id)
        );

        if (!alreadyRegistered) {
            let teamId = null;
            let team = null;

            // For team events, CREATE the team now (after successful payment)
            if (order.isTeamEvent && order.teamName) {
                // Generate join token
                const joinToken = `${event.event_slug || 'event'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

                team = new Team({
                    name: order.teamName,
                    event: event._id,
                    leader: order.userId,
                    members: [order.userId],
                    max_size: event.team_size,
                    join_token: joinToken,
                    status: 'active' // Team is active since payment is done
                });
                await team.save();
                teamId = team._id;

                // Update the order with the team ID
                order.teamId = teamId;
                await order.save();

                // Increment team count
                event.current_teams = (event.current_teams || 0) + 1;

                console.log(`Team "${team.name}" created after successful payment for order ${order.orderId}`);
                auditLogger.info(`Team created after payment`, {
                    orderId: order.orderId,
                    teamId: teamId,
                    teamName: team.name
                });
            }

            // Add registration to user
            user.Events_registered = user.Events_registered || [];
            user.Events_registered.push({
                event_id: event._id,
                event_slug: event.event_slug,
                registration_date: new Date(),
                Payment_status: 'Completed',
                team_id: teamId,
                team_role: teamId ? 'leader' : null
            });
            await user.save();

            // Log event registration
            auditLogger.audit.eventRegistration(req, order.userId, order.eventId, teamId);

            // Update event participant count
            event.current_participants = (event.current_participants || 0) + 1;

            // Send team QR code email to leader for team events
            if (team) {
                try {
                    // Generate team QR code
                    const qrBuffer = await generateTeamQRBuffer(
                        team._id.toString(),
                        event._id.toString(),
                        team.name,
                        event.event_name,
                        team.join_token
                    );

                    // Send email with QR code to team leader
                    await sendTeamJoinEmail(user.email, {
                        teamName: team.name,
                        joinToken: team.join_token,
                        eventName: event.event_name,
                        teamSize: event.team_size || team.max_size || 'Not specified',
                        leaderName: user.name
                    }, qrBuffer);

                    console.log(`Team QR code email sent to ${user.email} for team ${team.name}`);
                    auditLogger.info(`Team QR email sent for order ${order.orderId}`, {
                        teamId: team._id,
                        leaderEmail: user.email
                    });
                } catch (emailError) {
                    console.error('Error sending team QR email:', emailError);
                    auditLogger.error('Failed to send team QR email', emailError, {
                        orderId: order.orderId,
                        teamId: teamId
                    });
                    // Don't fail the payment processing if email fails
                }
            }

            // Close registration if capacity reached
            if (event.team_type === 'Individual' && event.max_participants &&
                event.current_participants >= event.max_participants) {
                event.registration_open = false;
            }
            if (event.team_type === 'Team' && event.max_teams &&
                event.current_teams >= event.max_teams) {
                event.registration_open = false;
            }

            await event.save();
        }

        auditLogger.info(`Payment successful for order ${order.orderId}`, {
            userId: order.userId,
            eventId: order.eventId
        });

        // TODO: Send confirmation email
        // await sendPaymentConfirmationEmail(user, event, order);

    } catch (error) {
        auditLogger.error('Error processing successful payment', error, { orderId: order.orderId });
        throw error;
    }
}

/**
 * Handle failed payment
 * @param {Object} order - Order document
 * @param {Object} errorData - Error details
 * @param {Object} req - Request object for logging
 */
async function handleFailedPayment(order, errorData, req = null) {
    try {
        order.status = 'FAILED';
        order.failedAt = new Date();
        order.failureReason = errorData.errorDesc || errorData.errorCode || 'Payment failed';
        order.paymentResponse = errorData.response;
        await order.save();

        // Update or create transaction record
        const transactionUpdate = {
            status: 'FAILED',
            responsePayload: errorData.response,
            errorCode: errorData.errorCode || errorData.response?.transaction_error_code,
            errorDescription: errorData.errorDesc || errorData.response?.transaction_error_desc || 'Payment failed',
            authStatus: errorData.response?.auth_status,
            failedAt: new Date()
        };

        // Try to find existing transaction, or create new one
        const existingTxn = await Transaction.findOne({ orderId: order.orderId });
        if (existingTxn) {
            Object.assign(existingTxn, transactionUpdate);
            await existingTxn.save();
        } else {
            // Create new transaction record if doesn't exist
            const newTxn = new Transaction({
                transactionId: `TXN_${order.orderId}_${Date.now()}`,
                orderId: order.orderId,
                bdOrderId: errorData.response?.bd_order_id || order.bdOrderId,
                userId: order.userId,
                eventId: order.eventId,
                teamId: order.teamId,
                amount: order.amount,
                currency: order.currency || 'INR',
                ...transactionUpdate
            });
            await newTxn.save();
        }

        // Log payment failure
        auditLogger.payment.paymentFailure(
            req,
            order.orderId,
            existingTxn?.transactionId || 'unknown',
            order.failureReason,
            errorData.errorCode
        );

        // If there was a team created, mark it as failed/cancelled
        if (order.teamId) {
            await Team.findByIdAndUpdate(order.teamId, { status: 'cancelled' });
        }

        auditLogger.info(`Payment failed for order ${order.orderId}`, {
            reason: order.failureReason,
            userId: order.userId
        });

    } catch (error) {
        auditLogger.error('Error processing failed payment', error, { orderId: order.orderId });
        throw error;
    }
}

/**
 * Verify payment status manually (for reconciliation)
 * POST /api/payment/verify
 */
export const verifyPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        // Validate config
        billDeskUtil.validateConfig();

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create status inquiry payload
        const statusPayload = {
            mercid: billDeskUtil.merchantId,
            orderid: orderId
        };

        const jwsToken = billDeskUtil.createJWSToken(statusPayload);

        // In production, make API call to BillDesk status endpoint
        // const response = await axios.post(billDeskUtil.getEndpoints().orderStatus, jwsToken, {
        //     headers: { 'Content-Type': 'application/jose' }
        // });

        return res.status(200).json({
            success: true,
            message: 'Status inquiry initiated',
            order: {
                orderId: order.orderId,
                status: order.status,
                amount: order.amount
            },
            // Include this for manual verification
            statusEndpoint: billDeskUtil.getEndpoints().orderStatus,
            statusToken: jwsToken
        });

    } catch (error) {
        console.error('Error verifying payment status:', error);
        return res.status(500).json({ message: 'Failed to verify payment status' });
    }
};

// ============================================
// ZAIKAA PAYMENT HANDLERS
// ============================================

/**
 * Handle BillDesk payment response for Zaikaa (Return URL)
 * This is called when BillDesk redirects back after payment
 * POST /api/payments/response-zaikaa
 */
export const handlePaymentResponseZaikaa = async (req, res) => {
    try {
        console.log('🍕 ZAIKAA Payment Response Received');
        auditLogger.payment.webhookReceived(req, 'BILLDESK_RESPONSE_ZAIKAA', req.body?.orderid || 'unknown');

        const responseBody = req.body || {};
        console.log("Received BillDesk Response for Zaikaa:", JSON.stringify(responseBody));

        // Helper to pick valid JWS token
        const pickJwsToken = (body) => {
            const directCandidates = [
                body?.encrypted_response,
                body?.transaction_response,
                body?.txnResponse,
                body?.txn_response
            ];

            const isValidJws = (str) => {
                if (typeof str !== 'string') return false;
                const trimmed = str.trim();
                const parts = trimmed.split('.');
                if (parts.length !== 3) return false;
                const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
                return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
            };

            let token = directCandidates.find(v => isValidJws(v));

            if (!token) {
                const objCandidate = directCandidates.find(v => v && typeof v === 'object');
                if (objCandidate) {
                    const nestedCandidates = [
                        objCandidate.encrypted_response,
                        objCandidate.transaction_response,
                        objCandidate.jws,
                        objCandidate.token
                    ];
                    token = nestedCandidates.find(v => isValidJws(v));
                }
            }

            return token;
        };

        const encrypted_response = pickJwsToken(responseBody);
        console.log("Extracted JWS token for Zaikaa:", encrypted_response ? `${encrypted_response.substring(0, 50)}...` : 'null');

        // Zaikaa frontend URL (Django) - base URL without /zaikaa prefix
        const ZAIKAA_URL = process.env.ZAIKAA_FRONTEND_URL || 'http://localhost:3001';

        // Handle case where no valid JWS token is found (user cancelled)
        if (!encrypted_response) {
            const orderid = responseBody.orderid || responseBody.orderId || responseBody.order_id;
            const terminalState = responseBody.terminal_state || responseBody.terminalState;
            
            if (orderid) {
                console.log(`Zaikaa transaction terminated/cancelled for order: ${orderid}`);
                
                // Check if transaction already succeeded - DON'T overwrite SUCCESS
                const transaction = await Transaction.findOne({ orderId: orderid });
                if (transaction) {
                    // IDEMPOTENCY: Only update if not already in a final successful state
                    if (transaction.status === 'SUCCESS') {
                        console.log(`⚠️ Transaction ${orderid} already SUCCESS, ignoring cancellation`);
                        return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-success?order_id=${orderid}&txn_id=${transaction.bdTransactionId || ''}&status=success`);
                    }
                    
                    // Only update to CANCELLED if not already successful
                    if (!['SUCCESS', 'REFUNDED'].includes(transaction.status)) {
                        transaction.status = 'CANCELLED';
                        transaction.errorDescription = 'Transaction terminated by user';
                        transaction.failedAt = new Date();
                        await transaction.save();
                    }
                }

                // Check ZaikaaOrder - DON'T overwrite PAID
                const zaikaaOrder = await ZaikaaOrder.findOne({ orderId: orderid });
                if (zaikaaOrder) {
                    // IDEMPOTENCY: Only update if not already in a final successful state
                    if (zaikaaOrder.status === 'PAID') {
                        console.log(`⚠️ ZaikaaOrder ${orderid} already PAID, ignoring cancellation`);
                        return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-success?order_id=${orderid}&status=success`);
                    }
                    
                    // Only update to CANCELLED if not already paid
                    if (!['PAID', 'REFUNDED'].includes(zaikaaOrder.status)) {
                        zaikaaOrder.status = 'CANCELLED';
                        zaikaaOrder.failureReason = 'Transaction terminated by user';
                        zaikaaOrder.failedAt = new Date();
                        await zaikaaOrder.save();
                        console.log(`⚠️ ZaikaaOrder updated to CANCELLED: ${orderid}`);
                    }
                }
                
                return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-failed?order_id=${orderid}&reason=cancelled`);
            }
            
            auditLogger.error('No valid transaction response received for Zaikaa', null, { ip: req.ip });
            return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-failed?error=no_response`);
        }

        // Verify and decode the JWS token
        let payload;
        try {
            const jwe = await verifyJwsPayload(encrypted_response);
            const decrypted = await decryptPayload(jwe);
            payload = JSON.parse(decrypted);
        } catch (cryptoError) {
            console.error('Crypto/decryption error for Zaikaa:', cryptoError.message);
            const orderid = responseBody.orderid || responseBody.orderId;
            return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-failed?error=decryption_error&order_id=${orderid || ''}`);
        }

        if (!payload) {
            return res.redirect(`${ZAIKAA_URL}/payment-failed?error=invalid_signature`);
        }

        console.log("Decrypted BillDesk Payload for Zaikaa:", payload);

        const {
            orderid,
            transactionid,
            auth_status,
            payment_method_type,
            transaction_error_code,
            transaction_error_desc
        } = payload;

        // Find the transaction (Zaikaa uses Transaction model, not Order)
        const transaction = await Transaction.findOne({ orderId: orderid });

        if (!transaction) {
            console.warn('Transaction not found for Zaikaa payment response:', orderid);
            return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-failed?error=order_not_found&order_id=${orderid}`);
        }

        // Find ZaikaaOrder
        const zaikaaOrder = await ZaikaaOrder.findOne({ orderId: orderid });

        // IDEMPOTENCY CHECK: If already in final state, redirect accordingly
        if (transaction.status === 'SUCCESS' || zaikaaOrder?.status === 'PAID') {
            console.log(`⚠️ IDEMPOTENCY: Order ${orderid} already processed as SUCCESS/PAID, skipping update`);
            return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-success?order_id=${orderid}&txn_id=${transaction.bdTransactionId || transactionid}&status=success`);
        }

        // Process based on auth_status (0300 = Success)
        if (auth_status === '0300') {
            // Payment successful
            transaction.status = 'SUCCESS';
            transaction.bdTransactionId = transactionid;
            transaction.paymentMethod = payment_method_type;
            transaction.authStatus = auth_status;
            transaction.responsePayload = payload;
            transaction.completedAt = new Date();
            await transaction.save();

            // Update ZaikaaOrder status to PAID
            if (zaikaaOrder) {
                zaikaaOrder.status = 'PAID';
                zaikaaOrder.transactionId = transactionid;
                zaikaaOrder.paymentMethod = payment_method_type;
                zaikaaOrder.paymentResponse = payload;
                zaikaaOrder.paidAt = new Date();
                await zaikaaOrder.save();
                console.log(`✅ ZaikaaOrder updated to PAID: ${orderid}`);
            }

            auditLogger.payment.paymentSuccess(req, orderid, transaction.amount);
            console.log(`✅ Zaikaa payment successful: Order ${orderid}, Transaction ${transactionid}`);

            // Redirect to Django success page with token (note: /zaikaa/ prefix for Django URL routing)
            return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-success?order_id=${orderid}&txn_id=${transactionid}&status=success`);
        } else {
            // Payment failed - but DON'T overwrite if already SUCCESS/PAID
            // (idempotency check above already handles this, but double-check)
            if (!['SUCCESS', 'REFUNDED'].includes(transaction.status)) {
                transaction.status = 'FAILED';
                transaction.errorCode = transaction_error_code;
                transaction.errorDescription = transaction_error_desc;
                transaction.responsePayload = payload;
                transaction.failedAt = new Date();
                await transaction.save();
            }

            // Update ZaikaaOrder status to FAILED (only if not already PAID)
            if (zaikaaOrder && !['PAID', 'REFUNDED'].includes(zaikaaOrder.status)) {
                zaikaaOrder.status = 'FAILED';
                zaikaaOrder.failureReason = transaction_error_desc;
                zaikaaOrder.paymentResponse = payload;
                zaikaaOrder.failedAt = new Date();
                await zaikaaOrder.save();
                console.log(`❌ ZaikaaOrder updated to FAILED: ${orderid}`);
            }

            auditLogger.payment.paymentFailed(req, orderid, transaction_error_desc);
            console.log(`❌ Zaikaa payment failed: Order ${orderid}, Error: ${transaction_error_desc}`);

            return res.redirect(
                `${ZAIKAA_URL}/zaikaa/payment-failed?order_id=${orderid}&error=${encodeURIComponent(transaction_error_desc || 'Payment failed')}`
            );
        }

    } catch (error) {
        auditLogger.error('Error handling Zaikaa payment response', error, { ip: req.ip });
        console.error('Error handling Zaikaa payment response:', error);
        const ZAIKAA_URL = process.env.ZAIKAA_FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${ZAIKAA_URL}/zaikaa/payment-failed?error=server_error`);
    }
};

/**
 * Handle BillDesk webhook/callback for Zaikaa (Server-to-Server)
 * POST /api/payments/webhook-zaikaa
 */
export const handleWebhookZaikaa = async (req, res) => {
    try {
        console.log('🔔 ZAIKAA WEBHOOK RECEIVED');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        
        auditLogger.payment.webhookReceived(req, 'BILLDESK_WEBHOOK_ZAIKAA', req.body?.orderid || 'unknown');

        // Verify request is from BillDesk (IP whitelist)
        const verifyIp = process.env.VERIFY_WEBHOOK_IP === 'true';
        if (verifyIp && !verifyBillDeskIP(req)) {
            console.warn('⚠️ Invalid IP for Zaikaa webhook:', req.ip);
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }

        const { encrypted_response, transaction_response } = req.body;
        const jws = encrypted_response || transaction_response;

        if (!jws) {
            console.warn('⚠️ No encrypted_response in Zaikaa webhook');
            return res.status(400).json({ status: 'error', message: 'No transaction response' });
        }

        // Verify JWS token and decrypt
        const jwe = await verifyJwsPayload(jws);
        if (!jwe) {
            return res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }

        const decrypted = await decryptPayload(jwe);
        const payload = JSON.parse(decrypted);

        if (!payload) {
            return res.status(400).json({ status: 'error', message: 'Invalid payload' });
        }

        const { orderid, transactionid, auth_status, payment_method_type, transaction_error_code, transaction_error_desc } = payload;

        // Find the transaction
        const transaction = await Transaction.findOne({ orderId: orderid });

        if (!transaction) {
            console.warn('Transaction not found for Zaikaa webhook:', orderid);
            return res.status(404).json({ status: 'error', message: 'Transaction not found' });
        }

        // Skip if already processed
        if (transaction.status === 'SUCCESS') {
            console.log('Zaikaa webhook for already processed transaction:', orderid);
            return res.status(200).json({ status: 'ok', message: 'Already processed' });
        }

        // Process payment
        if (auth_status === '0300') {
            transaction.status = 'SUCCESS';
            transaction.bdTransactionId = transactionid;
            transaction.paymentMethod = payment_method_type;
            transaction.authStatus = auth_status;
            transaction.responsePayload = payload;
            transaction.completedAt = new Date();
            await transaction.save();

            console.log(`✅ Zaikaa webhook: Payment successful for order ${orderid}`);
        } else {
            transaction.status = 'FAILED';
            transaction.errorCode = transaction_error_code;
            transaction.errorDescription = transaction_error_desc;
            transaction.responsePayload = payload;
            transaction.failedAt = new Date();
            await transaction.save();

            console.log(`❌ Zaikaa webhook: Payment failed for order ${orderid}`);
        }

        auditLogger.payment.webhookProcessed(req, orderid, auth_status === '0300' ? 'SUCCESS' : 'FAILED');
        return res.status(200).json({ status: 'ok', message: 'Webhook processed' });

    } catch (error) {
        auditLogger.error('Error handling Zaikaa webhook', error, { ip: req.ip });
        console.error('Error handling Zaikaa webhook:', error);
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
