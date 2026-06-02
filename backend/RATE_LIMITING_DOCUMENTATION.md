# Production-Level Rate Limiting Configuration

## Overview
This document details the comprehensive rate limiting strategy implemented across the Pratishtha Backend API for production-level security and stability.

---

## 1. Global Rate Limiters (Applied to All `/api/` Routes)

### `rateLimiters.api` - General API Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Skip Successful**: Yes (only count failed requests)
- **Use Case**: General API endpoint protection

### `slowDown` - Progressive Delay Middleware
- **Window**: 15 minutes
- **Trigger**: After 50 requests
- **Delay**: 500ms incremental (capped at 10 seconds)
- **Use Case**: Graceful rate limiting - slows down abusive requests instead of blocking

---

## 2. Authentication Rate Limiters

### `rateLimiters.auth` - Authentication Login Limiter
- **Window**: 15 minutes
- **Max Requests**: 5 per window
- **Applied To**:
  - `POST /api/admin/login`
  - `POST /api/users/auth/login`
  - `POST /api/users/auth/signup`
- **Purpose**: Prevent brute force attacks on login endpoints

### `rateLimiters.bruteForce` - Brute Force Protection
- **Window**: 1 hour
- **Max Requests**: 10 per window
- **Applied To**:
  - `POST /api/admin/login` (double protection)
- **Purpose**: Long-term IP-based brute force protection

### `rateLimiters.refresh` - Token Refresh Limiter
- **Window**: 5 minutes
- **Max Requests**: 10 per window
- **Applied To**:
  - `POST /api/admin/refresh-token`
  - `POST /api/users/auth/refresh-token`
- **Purpose**: Prevent token refresh abuse

---

## 3. Admin-Specific Rate Limiters

### `rateLimiters.adminCreation` - Admin Creation Limiter
- **Window**: 1 hour
- **Max Requests**: 3 per window
- **Applied To**:
  - `POST /api/admin/create-admin`
  - `POST /api/admin/create-coordinator`
- **Purpose**: Prevent mass admin account creation

---

## 4. User-Specific Rate Limiters

### `otpLimiter` - OTP Request Limiter
- **Window**: 15 minutes
- **Max Requests**: 5 per window
- **Applied To**:
  - `POST /api/users/auth/verify-email`
  - `POST /api/users/auth/resend-otp`
- **Purpose**: Prevent OTP spam and enumeration attacks

### `passwordResetLimiter` - Password Reset Limiter
- **Window**: 1 hour
- **Max Requests**: 5 per window
- **Applied To**:
  - `POST /api/users/auth/forgot-password`
  - `POST /api/users/auth/reset-password`
- **Purpose**: Prevent password reset abuse

### `contactFormLimiter` - Contact Form Limiter
- **Window**: 1 hour
- **Max Requests**: 5 per window
- **Applied To**:
  - `POST /api/users/contact`
- **Purpose**: Prevent spam via contact form

### `qrRegenerateLimiter` - QR Code Regeneration Limiter
- **Window**: 1 hour
- **Max Requests**: 3 per window
- **Applied To**:
  - `POST /api/users/qr-code/:userId/regenerate`
- **Purpose**: Prevent excessive QR code regeneration

---

## 5. Photo Upload Rate Limiters

### `rateLimiters.upload` - Upload Limiter
- **Window**: 15 minutes
- **Max Requests**: 20 per window
- **Applied To**:
  - `POST /api/photographer/photos/upload`
  - `POST /api/events/create` (event poster upload)
  - `PUT /api/events/:id` (event poster update)
  - `POST /api/sc-team` (team member profile upload)
- **Purpose**: Prevent abuse of file upload endpoints

### `rateLimiters.update` - Update Limiter
- **Window**: 5 minutes
- **Max Requests**: 30 per window
- **Applied To**:
  - `PUT /api/photographer/photos/:id`
  - `PUT /api/events/:id`
  - `PUT /api/sc-team/:id`
- **Purpose**: Moderate protection for metadata updates

### `rateLimiters.delete` - Delete Limiter
- **Window**: 10 minutes
- **Max Requests**: 10 per window
- **Applied To**:
  - `DELETE /api/photographer/photos/:id`
  - `DELETE /api/events/:id`
  - `DELETE /api/sc-team/:id`
- **Purpose**: Prevent accidental or malicious bulk deletions

---

## 6. Payment Rate Limiters

### `paymentCreationLimiter` - Payment Creation Limiter
- **Window**: 15 minutes
- **Max Requests**: 10 per window
- **Applied To**:
  - `POST /api/payments/create-order`
- **Purpose**: Prevent payment order spam

### `paymentStatusLimiter` - Payment Status Check Limiter
- **Window**: 5 minutes
- **Max Requests**: 30 per window
- **Applied To**:
  - `GET /api/payments/order/:orderId`
  - `GET /api/payments/history`
- **Purpose**: Allow reasonable polling without abuse

### `paymentRetryLimiter` - Payment Retry Limiter
- **Window**: 30 minutes
- **Max Requests**: 5 per window
- **Applied To**:
  - `POST /api/payments/retry`
- **Purpose**: Prevent payment retry spam

---

## 7. Event Rate Limiters

### `rateLimiters.api` - Event Operations
- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Applied To**:
  - `GET /api/events/public` (all public event endpoints)
  - `POST /api/events/public/register/:slug` (event registration)
  - `POST /api/events/public/join/:token` (team joining)
  - `GET /api/events/` (admin event listing)
  - `GET /api/events/:id` (event details)
  - `PATCH /api/events/:id/toggle-registration` (toggle registration status)
  - `GET /api/events/verify-code/:eventCode` (code verification)
- **Purpose**: General event endpoint protection

---

## 8. SC Team Rate Limiters

### Public Gallery Routes
- **Limiter**: `rateLimiters.api`
- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Applied To**:
  - `GET /api/sc-team/`
  - `GET /api/sc-team/grouped`
  - `GET /api/sc-team/:id`

### Protected Routes
- **Limiter**: `rateLimiters.upload`, `rateLimiters.update`, `rateLimiters.delete`
- **Applied To**:
  - `POST /api/sc-team/` (create with upload)
  - `PUT /api/sc-team/:id` (update with upload)
  - `DELETE /api/sc-team/:id` (delete)

---

## 9. Security Features

### Attack Pattern Detection
- Detects and blocks common attack patterns:
  - SQL injection attempts
  - XSS payloads
  - NoSQL injection
  - Path traversal
  - Suspicious keywords

### Content Security Headers
- `Cache-Control: no-store` - Prevents caching of sensitive data
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection

### Request ID Tracking
- Every request gets a unique ID for debugging
- Exposed via `X-Request-ID` header
- Used in all logs for request tracking

### Environment-Based Configuration
- **Development**: Rate limiting can be skipped with `SKIP_RATE_LIMIT=true`
- **Production**: Rate limiting is ALWAYS enforced
  - No development exemptions
  - Stricter limits on sensitive operations

---

## 10. Response Format

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many [operation]. Please try again in [X] minutes.",
  "retryAfter": 900
}
```

### Standard Error Response
Includes `requestId` for tracking and debugging across logs.

---

## 11. Implementation Details

### Skip Conditions
- **Development mode with skip flag**: Can temporarily disable for testing
- **Health check endpoint**: `/health` is excluded from logging
- **Webhook endpoints**: Special handling for BillDesk webhooks

### Storage
- In-memory storage (suitable for single-server)
- For distributed systems, consider Redis-based rate limiting

### IP Resolution
- Uses `express-rate-limit` default keyGenerator
- Properly handles IPv6 addresses
- Respects `X-Forwarded-For` header in production with trust proxy

---

## 12. Best Practices for Production

1. **Monitor Rate Limit Violations**
   - Review logs for suspicious IP addresses
   - Track patterns of attacks
   - Adjust limits based on actual usage

2. **User Communication**
   - Inform users about rate limits in API documentation
   - Provide clear error messages with retry timing
   - Suggest caching strategies on client-side

3. **Scaling Considerations**
   - Current: Single-server in-memory storage
   - For multiple servers: Migrate to Redis-based rate limiting
   - Use package: `rate-limit-redis`

4. **Regular Review**
   - Monitor API usage patterns
   - Adjust limits based on business requirements
   - Balance between security and usability

---

## 13. Configuration for Different Scenarios

### Legitimate Heavy Users
- Implement API keys with higher rate limits
- Use custom middleware for key-based limiting

### DDoS Protection
- Current setup provides good baseline protection
- For production with high traffic: Consider WAF or CDN

### Internal API Calls
- Service-to-service calls might need exclusions
- Use request headers to identify internal traffic

---

## 14. Testing Rate Limiters

### Manual Testing
```bash
# Test auth limiter (should fail after 5 attempts in 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Test slowDown (should add delays after 50 requests)
for i in {1..60}; do
  curl http://localhost:8000/api/events/public &
done
```

### Check Rate Limit Headers
```bash
curl -i http://localhost:8000/api/events/public
# Look for RateLimit-* headers in response
```

---

## 15. Monitoring and Logging

All rate limit violations are logged with:
- IP address
- Endpoint path
- Timestamp
- Request ID (for correlation)

Check logs:
```bash
grep "Rate limit exceeded" logs/error.log
```

---

## Production Deployment Checklist

- [x] Rate limiters configured for all endpoints
- [x] Progressive slowDown middleware active
- [x] Attack pattern detection enabled
- [x] Security headers configured
- [x] Request ID tracking active
- [x] Environment-based configuration
- [x] Audit logging enabled
- [x] CORS protection configured
- [x] Helmet security headers active
- [ ] Monitor rate limits in production
- [ ] Set up alerts for excessive violations
- [ ] Configure Redis for distributed systems (if needed)
- [ ] Document API rate limits in developer docs

---

## Support and Adjustment

For production adjustments or issues:
1. Check the `securityMiddleware.js` file for limiter definitions
2. Review rate limit constants in route files
3. Adjust `windowMs` and `max` values as needed
4. Test changes in development before deploying
5. Monitor effects on legitimate users

