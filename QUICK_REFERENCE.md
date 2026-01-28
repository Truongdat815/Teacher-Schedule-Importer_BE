# 🎯 Quick Reference - New API Endpoints

## 🔥 What's New

### 1. Logout Endpoint
```
POST /api/auth/logout
```
| Property | Value |
|----------|-------|
| **Status** | ✅ Working |
| **Auth Required** | ✅ Yes (JWT token) |
| **Rate Limited** | ✅ Yes (5/15min) |
| **Response** | `{"success": true, "message": "..."}` |
| **Error Code** | 401 (Unauthorized) |
| **Use Case** | Log user out, clear session |

---

### 2. Get Calendar Events Endpoint
```
GET /api/calendar/events
```
| Property | Value |
|----------|-------|
| **Status** | ✅ Working |
| **Auth Required** | ✅ Yes (JWT token) |
| **Rate Limited** | ❌ No |
| **Response** | Array of events with project info |
| **Error Code** | 401 (Unauthorized) |
| **Use Case** | Display synced calendar events |

---

## 📊 Complete Endpoint List

| # | Method | Endpoint | Auth | Rate | Purpose |
|---|--------|----------|------|------|---------|
| 1 | GET | `/api/health` | ❌ | ❌ | Health check |
| 2 | GET | `/api/auth/google/url` | ❌ | ✅ | Get OAuth URL |
| 3 | GET | `/api/auth/google/callback` | ❌ | ✅ | OAuth callback |
| 4 | POST | `/api/auth/refresh` | ❌ | ✅ | Refresh token |
| 5 | POST | `/api/auth/logout` | ✅ | ✅ | **Logout** 🆕 |
| 6 | POST | `/api/sheets/preview` | ✅ | ❌ | Preview sheet |
| 7 | POST | `/api/calendar/sync` | ✅ | ❌ | Sync to calendar |
| 8 | GET | `/api/calendar/events` | ✅ | ❌ | **Get events** 🆕 |

---

## 🧪 Quick Test Commands

### Test Health
```bash
curl http://localhost:5000/api/health
```
Expected: `{"success":true,"status":"ok","message":"API is healthy"}`

### Test Logout (No Auth - Should Fail)
```bash
curl -X POST http://localhost:5000/api/auth/logout
```
Expected: `{"success":false,"error":"Unauthorized",...}`

### Test Get Events (No Auth - Should Fail)
```bash
curl http://localhost:5000/api/calendar/events
```
Expected: `{"success":false,"error":"Unauthorized",...}`

### Test With Valid Token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/calendar/events
```
Expected: `{"success":true,"message":"...","data":{...}}`

---

## 🔐 Authentication

### How to Authenticate

**Option 1: Authorization Header**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Option 2: Cookie (Automatic)**
```
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get JWT Token
1. Go to `/api/auth/google/url`
2. Login with Google
3. Backend automatically sets `accessToken` cookie
4. OR stores token in response

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "previous-refresh-token"
}
```

---

## 💻 Frontend Code Examples

### JavaScript - Fetch API

**Logout:**
```javascript
const logout = async () => {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });
  return res.json();
};
```

**Get Calendar Events:**
```javascript
const getEvents = async () => {
  const res = await fetch('/api/calendar/events', {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });
  return res.json();
};
```

### React - Hook Example

```javascript
import { useState, useEffect } from 'react';

export function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetch('/api/calendar/events', {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setEvents(data.data.events);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Calendar Events ({events.length})</h2>
      {events.map(event => (
        <div key={event.id}>
          <h3>{event.stage}</h3>
          <p>Date: {event.date}</p>
          <p>Room: {event.room}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Complete API reference |
| [TEST_API_RESULTS.md](./TEST_API_RESULTS.md) | Test results & verification |
| [TASK_COMPLETION.md](./TASK_COMPLETION.md) | What was done & how to use |

---

## 🌐 API Documentation UI

**Swagger/OpenAPI:** http://localhost:5000/api-docs/

All endpoints documented with:
- Descriptions (English & Vietnamese)
- Request/response schemas
- Try it out feature
- Example data

---

## ⚠️ Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login first."
}
```
**Fix:** Add `Authorization: Bearer <TOKEN>` header

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```
**Fix:** Wait 15 minutes or check `RateLimit-Reset` header

### CORS Error
```
Access-Control-Allow-Origin header missing
```
**Fix:** Ensure `credentials: 'include'` in fetch options

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd Teacher-Schedule-Importer_BE
npm run dev
```

### 2. Access Swagger UI
Open: http://localhost:5000/api-docs/

### 3. Login with Google
Click: `GET /api/auth/google/url` → "Try it out"

### 4. Get Calendar Events
Use the returned token with: `GET /api/calendar/events`

### 5. Logout
Call: `POST /api/auth/logout`

---

## 📊 Status

| Component | Status |
|-----------|--------|
| Backend Server | ✅ Running |
| New Endpoints | ✅ Working |
| Tests | ✅ Passing |
| Documentation | ✅ Complete |
| Security | ✅ Configured |
| Swagger UI | ✅ Available |

---

## 📞 Support

**Issues?** Check:
1. Server is running: `http://localhost:5000/api/health`
2. Token is valid (not expired)
3. Correct HTTP method (GET vs POST)
4. Content-Type header is `application/json`
5. Check Swagger UI for request format

**Debug Mode:**
```bash
DEBUG=* npm run dev  # Show all logs
```

---

**Last Updated:** January 28, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
