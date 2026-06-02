import crypto from 'crypto';
import { encryptPayload } from './Payment_Utils/EncrypPayload.js';
import { signPayload } from './Payment_Utils/SigningPayload.js';
import { decryptPayload, verifyJwsPayload } from './Payment_Utils/DecryptPayload.js';

/**
 * BillDesk Payment Gateway Utility
 * Handles signature generation and verification for BillDesk API v1.2
 */

class BillDeskUtil {
    constructor() {
        this.merchantId = process.env.BILLDESK_MERCHANT_ID;
        this.clientId = process.env.BILLDESK_CLIENT_ID;
        this.encryptionKey = process.env.BILLDESK_ENCRYPTION_KEY;
        this.signingKey = process.env.BILLDESK_SIGNING_KEY;
        this.baseUrl = process.env.BILLDESK_BASE_URL || 'https://pguat.billdesk.io'; // UAT URL, change for production
    }

    /**
     * Validate BillDesk configuration
     */
    validateConfig() {
        if (!this.merchantId || !this.clientId || !this.encryptionKey || !this.signingKey) {
            throw new Error('BillDesk configuration missing. Please set BILLDESK_MERCHANT_ID, BILLDESK_CLIENT_ID, BILLDESK_ENCRYPTION_KEY, and BILLDESK_SIGNING_KEY in environment variables.');
        }
        return true;
    }

    /**
     * Generate a unique trace ID for request tracking
     */
    generateTraceId() {
        return `TRC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    getISTTimestamp() {
        const now = new Date();

        // Convert to IST
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        const istMs = utcMs + (5 * 60 + 30) * 60000;
        const ist = new Date(istMs);

        const pad = (n) => n.toString().padStart(2, "0");

        return (
            ist.getFullYear().toString() +
            pad(ist.getMonth() + 1) +
            pad(ist.getDate()) +
            pad(ist.getHours()) +
            pad(ist.getMinutes()) +
            pad(ist.getSeconds())

        );

    }

    /**
     * Make API call to BillDesk to create order
     * @param {object} orderPayload - Order payload
     * @returns {Promise<object>} - BillDesk response with redirect URL
     */
    async createOrder(orderPayload) {
        const encryptedPayload = await encryptPayload(orderPayload);
        const signedPayload = await signPayload(encryptedPayload);
        const traceId = this.generateTraceId();
        const timestamp = this.getISTTimestamp();

        const response = await fetch(this.getEndpoints().createOrder, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/jose',
                'Accept': 'application/jose',
                'BD-Traceid': traceId,
                'BD-Timestamp': timestamp
            },
            body: signedPayload
        });

        const responseText = await response.text();

        if (!response.ok) {
            try {
                // 1️⃣ BillDesk sends error as JWS (signed)
                const jws = responseText;

                // 2️⃣ Verify JWS → get JWE
                const jwe = await verifyJwsPayload(jws);

                // 3️⃣ Decrypt JWE → get actual JSON error
                const decryptedPayload = await decryptPayload(jwe);

                console.error("🔓 Decrypted BillDesk error:", decryptedPayload);

                // 4️⃣ Throw meaningful error
                let errorJson;
                try {
                    errorJson = JSON.parse(decryptedPayload);
                } catch {
                    errorJson = { message: decryptedPayload };
                }

                throw new Error(
                    `BillDesk Error [${errorJson.error_code || 'UNKNOWN'}]: ${errorJson.message || response.statusText
                    }`
                );
            } catch (e) {
                console.error("❌ Failed to decrypt BillDesk error:", e.message);

                // fallback if decryption fails
                throw new Error(`BillDesk API error: ${response.statusText}`);
            }
        }

        // 1️⃣ BillDesk sends success response as JWS (signed)
        const jws = responseText;
        // 2️⃣ Verify JWS → get JWE
        const jwe = await verifyJwsPayload(jws);
        // 3️⃣ Decrypt JWE → get actual JSON response
        const decryptedResponse = await decryptPayload(jwe);
        const decodedResponse = JSON.parse(decryptedResponse);
        

        return {
            success: true,
            data: decodedResponse,
            traceId: traceId
        };
    }





    /**
     * Get BillDesk API endpoints
     */
    getEndpoints() {
        return {
            // BillDesk UAT create endpoint expects POST form with transaction_request
            createOrder: `${this.baseUrl}/payments/ve1_2/orders/create`,
            orderStatus: `${this.baseUrl}/pgsi/v1/pgi/orders/status`,
            refund: `${this.baseUrl}/pgsi/v1/pgi/refunds`
        };
    }
}

// Export singleton instance
const billDeskUtil = new BillDeskUtil();
export default billDeskUtil;
