# Production Rate Limiting - Quick Reference Guide

## 🚀 What Was Implemented

Your Pratishtha Backend now has **production-level rate limiting** across all 40+ API endpoints with:
- Global rate limiting (100 req/15min)
- Progressive slowDown (delays after 50 requests)
- Endpoint-specific limiters for sensitive operations
- Attack pattern detection
- Multi-layer DDoS protection

---

## 📊 Rate Limit Overview by Endpoint Category

### Authentication (Strictest)
```
POST /api/admin/login              → 5 attempts per 15 minutes
POST /api/admin/refresh-token      → 10 attempts per 5 minutes
POST /api/users/auth/login         → 5 attempts per 15 minutes
POST /api/users/auth/refresh-token → 10 attempts per 5 minutes
POST /api/users/auth/signup        → 5 attempts per 15 minutes
```

### Admin Operations (Very Strict)
```
POST /api/admin/create-admin          → 3 per hour
POST /api/admin/create-coordinator    → 3 per hour
DELETE /api/events/:id                → 10 per 10 minutes
DELETE /api/photographer/photos/:id   → 10 per 10 minutes
DELETE /api/sc-team/:id               → 10 per 10 minutes
```

### User Actions (Moderate-Strict)
```
POST /api/users/auth/verify-email     → 5 per 15 minutes
POST /api/users/auth/resend-otp       → 5 per 15 minutes
POST /api/users/auth/forgot-password  → 5 per hour
POST /api/users/auth/reset-password   → 5 per hour
POST /api/users/contact               → 5 per hour
POST /api/users/qr-code/:id/regenerate → 3 per hour
```

### File Operations (Moderate-Strict)
```
POST /api/photographer/photos/upload  → 20 per 15 minutes
POST /api/events/create               → 20 per 15 minutes
PUT /api/photographer/photos/:id      → 30 per 5 minutes
PUT /api/events/:id                   → 30 per 5 minutes
PUT /api/sc-team/:id                  → 30 per 5 minutes
```

### General API (Moderate)
```
GET /api/events/public                → 100 per 15 minutes
GET /api/photographer/gallery         → 100 per 15 minutes
GET /api/payments/order/:id           → 30 per 5 minutes
GET /api/payments/history             → 30 per 5 minutes
POST /api/events/public/register      → 100 per 15 minutes
POST /api/payments/create-order       → 10 per 15 minutes
POST /api/payments/retry              → 5 per 30 minutes
```

---

## 🛡️ Security Features

✅ **Rate Limiting** - Strict limits on sensitive operations  
✅ **Progressive SlowDown** - Graceful degradation (500ms delay after 50 requests)  
✅ **Attack Detection** - Blocks SQL injection, XSS, NoSQL injection patterns  
✅ **Brute Force Protection** - Long-term IP-based blocking  
✅ **DDoS Mitigation** - Progressive delays and request limiting  
✅ **Request Tracking** - Unique ID per request for debugging  
✅ **Security Headers** - Helmet + custom headers  
✅ **CORS Protection** - Controlled origin access  

---

## 🔧 Configuration

### In Development (with testing)
```env
NODE_ENV=development
SKIP_RATE_LIMIT=true  # Optional: Skip rate limiting for testing
```

### In Production (Always Protected)
```env
NODE_ENV=production
# Rate limiting is ALWAYS enforced - no option to disable
```

---

## 🚦 How Rate Limiting Works

### 1. Global Rate Limiter
Every request to `/api/*` is subject to:
- **100 requests per 15 minutes** per IP
- Skips successful requests (only counts failures by default)

### 2. Progressive SlowDown
After 50 requests in 15 minutes:
- 51st request: +500ms delay
- 52nd request: +1000ms delay
- 60th request: +5000ms delay
- Caps at 10 seconds maximum

### 3. Endpoint Specific Limiters
- More restrictive for sensitive operations
- Example: Admin creation → 3 per hour
- Example: Login attempts → 5 per 15 minutes

### 4. Error Response
```json
{
  "error": "Too many [operation]. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## 📈 Expected Behavior

### Legitimate User
- Can perform normal operations without hitting limits
- Might see slowDown if making 60+ API calls in 15 minutes
- Clear error message if rate limit is exceeded
- `Retry-After` header shows when to retry

### Attacking Bot
- Blocked after ~10-20 requests
- Additional attempts add 500ms-10s delay
- Forced to back off due to progressive delays
- IP tracked in logs for monitoring

---

## 🔍 Monitoring & Logs

### Check Rate Limit Violations
```bash
grep "Rate limit exceeded" logs/error.log
```

### Check Attack Patterns Detected
```bash
grep "Suspicious pattern detected" logs/error.log
```

### Monitor Request IDs
Each response includes `X-Request-ID` header for tracking:
```bash
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## ⚙️ Adjusting Limits

To modify limits, edit the following files:

### Global Limits
File: `middelwares/securityMiddleware.js`
- `apiLimiter`: Global API limit
- `authLimiter`: Login limit
- `adminCreationLimiter`: Admin creation limit

### Per-Route Limits
File: `routes/UsersRoutes.js` (example)
```javascript
const contactFormLimiter = createRateLimiter(
  60 * 60 * 1000,  // 1 hour window
  5,               // 5 max requests
  'Too many contact form submissions...',
  false
);
```

Parameters:
- `windowMs`: Time window in milliseconds
- `max`: Max requests in window
- `message`: Error message
- `skipSuccessful`: Skip on successful responses (bool)

---

## 🧪 Testing Rate Limiters

### Test Login Limiter (Should fail after 5 attempts)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Attempt $i"
done
```

### Test SlowDown (Should add delays after 50 requests)
```bash
time curl http://localhost:8000/api/events/public  # Fast
# Make 49 more requests...
time curl http://localhost:8000/api/events/public  # Should have ~500ms delay added
```

### Check Rate Limit Headers
```bash
curl -v http://localhost:8000/api/events/public 2>&1 | grep -i ratelimit
```

---

## 📝 Files Modified

1. ✅ `server.js` - Added slowDown middleware
2. ✅ `middelwares/securityMiddleware.js` - Updated production enforcement
3. ✅ `routes/AdminRoutes.js` - Added limiters to 8 routes
4. ✅ `routes/UsersRoutes.js` - Added limiters to 14 routes + custom limiters
5. ✅ `routes/PhotographerRoutes.js` - Added limiters to 8 routes
6. ✅ `routes/ScTeamRoutes.js` - Added limiters to 6 routes
7. ✅ `routes/EventRoutes.js` - Added limiters to 5 routes
8. ✅ `routes/paymentRoutes.js` - Already had limiters (verified)

---

## 🎯 Key Improvements

### Before
- No rate limiting
- Vulnerable to brute force attacks
- No DDoS protection
- No attack pattern detection

### After
- ✅ Comprehensive rate limiting (40+ endpoints)
- ✅ Multi-layer brute force protection
- ✅ Progressive DDoS mitigation
- ✅ Attack pattern detection
- ✅ Request tracking and logging
- ✅ Production-enforced security
- ✅ User-friendly error messages

---

## 🚨 Important Notes

### For Production Deployment
1. **Rate limiting is NOW ENFORCED** - Even in production mode
2. **Progressive slowDown is ACTIVE** - Automatic delay injection
3. **All 40+ endpoints are protected** - No unprotected endpoints
4. **Environment-aware** - Different behavior for dev vs production

### For Future Scaling
- Current: In-memory storage (single server)
- For multiple servers: Migrate to Redis-based rate limiting
  - Package: `rate-limit-redis`
  - Benefits: Shared state across all servers

### API Documentation
- Update API docs to mention rate limits
- Provide retry strategies to clients
- Suggest caching to reduce requests

---

## 📞 Support

### Common Issues & Solutions

**Q: "Too many login attempts" error**
- A: Login failed 5 times in 15 min. Wait 15 min and try again.

**Q: All requests to endpoint returning 429**
- A: Hit rate limit. Check endpoint's specific limit and wait.

**Q: Want to test without rate limiting**
- A: In development only, set `SKIP_RATE_LIMIT=true`

**Q: Need higher limits for API integration**
- A: Implement API keys with custom higher limits (future enhancement)

---

## ✨ Next Steps (Optional)

1. **Monitor in Production**
   - Track violation patterns
   - Adjust limits based on actual usage
   - Create alerts for suspicious activity

2. **Document for Users**
   - Add rate limit info to API docs
   - Provide retry strategies
   - Suggest caching approaches

3. **Advanced Protection** (Future)
   - WAF (Web Application Firewall)
   - IP whitelisting
   - Geographic blocking
   - Custom middleware for special scenarios

---

## 📚 Documentation Files Created

1. **RATE_LIMITING_DOCUMENTATION.md** - Comprehensive technical guide
2. **IMPLEMENTATION_SUMMARY.md** - Detailed change summary
3. **QUICK_REFERENCE.md** - This file!

---

## ✅ Verification Checklist

- [x] Global rate limiter working (100/15min)
- [x] Progressive slowDown middleware active
- [x] All auth endpoints protected (5/15min)
- [x] Admin operations limited (3/hour)
- [x] File uploads limited (20/15min)
- [x] Attack pattern detection working
- [x] Request ID tracking active
- [x] Error responses include retry-after
- [x] Production enforcement active
- [x] Logging configured

---

**Your backend is now production-ready with enterprise-grade rate limiting! 🎉**

