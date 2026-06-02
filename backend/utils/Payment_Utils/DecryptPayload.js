// // Test block: decode provided JWS and log result
// if (process.env.NODE_ENV !== 'production') {
//     (async () => {
//         const jws = 'eyJhbGciOiJIUzI1NiIsImNsaWVudGlkIjoidWF0c2FrZWN2MiIsImtpZCI6IkhNQUMifQ.ZXlKamJHbGxiblJwWkNJNkluVmhkSE5oYTJWamRqSWlMQ0psYm1NaU9pSkJNalUyUjBOTklpd2lZV3huSWpvaVpHbHlJaXdpYTJsa0lqb2llSFo0U0RaU1QwSnBObEJuSW4wLi5Jbmo2eDF1Y1N5cl9OTU1PLkMxU1hOOWhrcTFDM2R5Vk5TZEotM1BQRjRLMXF0UUZKTEo3VXFuSUdXeVZ2RU5zZ1JOOWU1b2xMaGZJbTBETFhwMkRnNmdwMEpqTnNHZnQ5WlB4bjFhSjE1X2dnNWlQVUk2VlZuRVB3VVd3MjJuMi1CYndwUFVGR1FtVEExdjdRNTlvUkVZeWFvQU9JUE4zdHVMZy5fUHQyN3NzS1pwcmFMb3hiWWRuUGR3.zDLY8x-c9Of0JtFWFS3ZsQv-CeMgOQ9YH6fSGf9x-ck';
//         try {
//             const payload = await verifyJwsPayload(jws);
//             console.log('Decoded payload:', payload);
//             const decryptedPayload = await decryptPayload(payload);
//             console.log('Decoded payload:', decryptedPayload);
//         } catch (err) {
//             console.error('JWS decode/verify error:', err);
//         }
//     })();
// }
import jose from 'node-jose';


/**
 * Verifies and decodes a JWS (signed JWT) using BillDesk signing key from .env
 * @param {string} jws - The JWS compact string to verify and decode
 * @returns {Promise<object>} - The decoded payload as an object if signature is valid
 */
export async function verifyJwsPayload(jws) {
    const signingKey = process.env.BILLDESK_SIGNING_KEY || 'GFSgVvMFWwrVXmH03ynU57sQeoh49PGE';
    const signingKeyId = process.env.BILLDESK_KEY_ID || 'HMAC';
    console.log(signingKey, signingKeyId);
    if (!signingKey || !signingKeyId) {
        throw new Error('Missing BILLDESK_SIGNING_KEY or BILLDESK_KEY_ID in .env');
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
    const result = await jose.JWS.createVerify(key).verify(jws);
    const raw = result.payload.toString('utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Payload is not valid JSON. Raw payload:', raw);
        return raw;
    }
}

/**
 * Decrypts a JWE payload using BillDesk keys from .env
 * @param {string} jwe - The JWE compact string to decrypt
 * @returns {Promise<string>} - The decrypted plaintext (JSON string)
 */
export async function decryptPayload(jwe) {
    const encryptionKey = process.env.BILLDESK_ENCRYPTION_KEY || 'RcnT73n4W28UOMWtpX0BFXpin8y9hZ3I';
    const encryptionKeyId = process.env.BILLDESK_KEY_ID || 'xvxH6ROBi6Pg';

    if (!encryptionKey || !encryptionKeyId) {
        throw new Error('Missing BILLDESK_ENCRYPTION_KEY or BILLDESK_KEY_ID in .env');
    }

    const keystore = jose.JWK.createKeyStore();
    const keyB64Url = Buffer.from(encryptionKey, 'utf8').toString('base64url');
    const jwk = {
        kty: "oct",
        k: keyB64Url,
        alg: "A256GCM",
        kid: encryptionKeyId
    };
    const key = await keystore.add(jwk);
    const decrypted = await jose.JWE.createDecrypt(key).decrypt(jwe);
    return decrypted.plaintext.toString('utf8');
}
