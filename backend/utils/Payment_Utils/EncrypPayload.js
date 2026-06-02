import jose from 'node-jose';

/**
 * Encrypts the data using the encryption key in A256GCM algorithm (JWE compact format)
 * Uses keys from .env
 * @param {string|Buffer} payload - The plaintext payload to encrypt
 * @returns {Promise<string>} - JWE compact string
 */
export async function encryptPayload(payload) {
    const clientId = process.env.BILLDESK_CLIENT_ID;
    const encryptionKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const encryptionKeyId = process.env.BILLDESK_KEY_ID;

    if (!clientId || !encryptionKey || !encryptionKeyId) {
        throw new Error('Missing BILLDESK_CLIENT_ID, BILLDESK_ENCRYPTION_KEY, or BILLDESK_ENCRYPTION_KEY_ID in .env');
    }

    const keystore = jose.JWK.createKeyStore();
    // Ensure key is base64url encoded
    const keyB64Url = Buffer.from(encryptionKey, 'utf8').toString('base64url');
    const jwk = {
        kty: "oct",
        k: keyB64Url,
        alg: "A256GCM",
        kid: encryptionKeyId
    };
    const key = await keystore.add(jwk);
    let input;
    if (Buffer.isBuffer(payload)) {
        input = payload;
    } else if (typeof payload === 'object') {
        input = Buffer.from(JSON.stringify(payload), "utf8");
    } else {
        input = Buffer.from(payload, "utf8");
    }
    const header = {
        alg: "dir",
        enc: "A256GCM",
        kid: encryptionKeyId,
        clientid: clientId,
    };
    const encrypted = await jose.JWE.createEncrypt(
        { format: "compact", fields: header },
        key
    ).update(input).final();
    return encrypted;
}