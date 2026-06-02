
/**
 * Signs the payload using HMAC-SHA256 (JWS compact format) with BillDesk keys from .env
 * @param {string|Buffer} payload - The payload to sign (usually encrypted JWE string)
 * @returns {Promise<string>} - JWS compact string
 */
import jose from "node-jose";
export async function signPayload(payload) {
    const clientId = process.env.BILLDESK_CLIENT_ID;
    const signingKey = process.env.BILLDESK_SIGNING_KEY;
    const signingKeyId = process.env.BILLDESK_KEY_ID;

    if (!clientId || !signingKey || !signingKeyId) {
        throw new Error('Missing BILLDESK_CLIENT_ID, BILLDESK_SIGNING_KEY, or BILLDESK_SIGNING_KEY_ID in .env');
    }

    const keystore = jose.JWK.createKeyStore();
    const keyB64Url = Buffer.from(signingKey, 'utf8').toString('base64url');
    const jwk = {
        kty: "oct",
        k: keyB64Url,
        alg: "HS256",
        kid: signingKeyId
    };
    const key = await keystore.add(jwk);
    const jwsHeader = {
        alg: "HS256",
        kid: signingKeyId,
        clientid: clientId
    };
    const jwsObject = await jose.JWS.createSign(
        {
            format: 'compact',
            fields: jwsHeader
        },
        key
    ).update(payload).final();
    return jwsObject;
}
