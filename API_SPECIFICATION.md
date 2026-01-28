# 📖 API Specification - Teacher Schedule Importer Backend

## Base URL
- **Development:** `http://localhost:5000`
- **Production:** `https://api.your-domain.com` (configure in `.env`)

## Authentication
All protected endpoints require one of:
- **Authorization Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Cookie:** `accessToken=<JWT_TOKEN>` (automatically sent by browser)

## Rate Limiting
- Auth endpoints: **5 requests per 900 seconds**
- Other endpoints: No limit
- Headers returned: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## 📋 Endpoints

### 1️⃣ Health Check
**Endpoint:** `GET /api/health`

**Description:** Check API health status

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "success": true,
  "status": "ok",
  "message": "API is healthy"
}
```

---

### 2️⃣ Get Google OAuth URL
**Endpoint:** `GET /api/auth/google/url`

**Description:** Get the Google OAuth 2.0 login URL

**Authentication:** Not required

**Rate Limited:** Yes (5 per 15 min)

**Response (302 Found):**
Redirects to: `https://accounts.google.com/o/oauth2/v2/auth?...`

**Scopes Requested:**
- `userinfo.profile` - User profile (name, picture)
- `userinfo.email` - User email
- `calendar` - Create/edit calendar events
- `spreadsheets.readonly` - Read Google Sheets

**Example Frontend Usage:**
```javascript
// Method 1: Simple redirect
window.location.href = 'http://localhost:5000/api/auth/google/url';

// Method 2: Open in popup
window.open('http://localhost:5000/api/auth/google/url', 'google-auth', 'width=500,height=600');
```

---

### 3️⃣ Google OAuth Callback
**Endpoint:** `GET /api/auth/google/callback?code=...&state=...`

**Description:** Handle Google OAuth callback (automatic)

**Authentication:** Not required (handled by Google)

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - Security token

**Response (302 Found):**
Redirects to: `http://localhost:5173/dashboard?success=true&email=user@example.com`

**Cookies Set:**
- `accessToken` - JWT token (7 days, httpOnly)
- `refreshToken` - Refresh token (30 days, httpOnly)

**Error Redirect:**
`http://localhost:5173/login?error=Error+message`

---

### 4️⃣ Refresh Access Token
**Endpoint:** `POST /api/auth/refresh`

**Description:** Get new access token using refresh token

**Authentication:** Not required

**Rate Limited:** Yes (5 per 15 min)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid or expired refresh token"
}
```

**Frontend Usage:**
```javascript
async function refreshToken() {
  const response = await fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: stored_refresh_token })
  });
  const data = await response.json();
  if (data.success) {
    // Store new tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
}
```

---

### 5️⃣ Logout User [NEW]
**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user and clear session cookies

**Authentication:** Required (JWT token)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `accessToken` - Cleared (Max-Age: 0)
- `refreshToken` - Cleared (Max-Age: 0)

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login first."
}
```

**Frontend Usage:**
```javascript
async function logout() {
  const response = await fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include' // Important: send cookies
  });
  
  if (response.ok) {
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Redirect to login
    window.location.href = '/login';
  }
}
```

---

### 6️⃣ Preview Sheet Data
**Endpoint:** `POST /api/sheets/preview`

**Description:** Parse and preview Google Sheet row data

**Authentication:** Required (JWT token)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Capstone 2026",
  "rowNumber": 4,
  "rowData": {
    "Topic Code": "SP123456",
    "Group Code": "GSP123345",
    "Topic (EN)": "Portfolio",
    "Topic (VI)": "Nền tảng vay dụng",
    "Mentor": "Trương Long",
    "Mentor 1": "Trương Long 1",
    "Mentor 2": "Trương Long 2"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sheet data previewed successfully",
  "data": {
    "topicCode": "SP123456",
    "groupCode": "GSP123345",
    "topicNameEn": "Portfolio",
    "topicNameVi": "Nền tảng vay dụng",
    "mentor": "Trương Long",
    "mentor1": "Trương Long 1",
    "mentor2": "Trương Long 2",
    "parseStatus": "success",
    "events": [
      {
        "stage": "REV1",
        "scheduledDate": "2026-03-15"
      }
    ]
  }
}
```

---

### 7️⃣ Sync to Calendar
**Endpoint:** `POST /api/calendar/sync`

**Description:** Parse sheet row and sync events to Google Calendar

**Authentication:** Required (JWT token)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Capstone 2026",
  "rowNumber": 4,
  "rowData": {
    "Topic Code": "SP123456",
    "Group Code": "GSP123345",
    "Topic (EN)": "Portfolio",
    "Topic (VI)": "Nền tảng vay dụng"
  },
  "syncOptions": {
    "syncAllStages": true,
    "overwriteExisting": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sheet synced to calendar successfully",
  "data": {
    "project": {
      "id": "project-uuid",
      "topicCode": "SP123456",
      "groupCode": "GSP123345",
      "topicNameVi": "Nền tảng vay dụng"
    },
    "syncResults": [
      {
        "stage": "REV1",
        "status": "success",
        "googleEventId": "abc123def456"
      },
      {
        "stage": "REV2",
        "status": "success",
        "googleEventId": "xyz789uvw012"
      }
    ],
    "summary": {
      "totalStages": 5,
      "successfulSyncs": 5,
      "failedSyncs": 0
    }
  }
}
```

---

### 8️⃣ Get Synced Events [NEW]
**Endpoint:** `GET /api/calendar/events`

**Description:** Retrieve all calendar events synced for current user

**Authentication:** Required (JWT token)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Synced events retrieved successfully",
  "data": {
    "events": [
      {
        "id": "event-uuid",
        "stage": "REV1",
        "date": "2026-03-15T00:00:00Z",
        "slot": "1",
        "room": "Room 100",
        "councilCode": "COUNCIL-001",
        "reviewer1": "Dr. Reviewer 1",
        "reviewer2": "Dr. Reviewer 2",
        "googleEventId": "google-calendar-id-123",
        "lastSyncedAt": "2026-01-28T09:00:00Z",
        "syncStatus": "success",
        "projectId": "project-uuid",
        "projectTopicCode": "SP123456",
        "projectGroupCode": "GSP123345"
      }
    ],
    "projectCount": 5,
    "eventCount": 25
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login first."
}
```

**Frontend Usage:**
```javascript
async function getCalendarEvents() {
  const response = await fetch('http://localhost:5000/api/calendar/events', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include'
  });
  
  const data = await response.json();
  if (data.success) {
    console.log(`Found ${data.data.eventCount} events`);
    data.data.events.forEach(event => {
      console.log(`${event.stage}: ${event.date}`);
    });
  }
}
```

---

## Error Response Format

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login first."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 302 | Found | Redirect (OAuth URLs) |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

---

## Headers

### Request Headers (Protected Endpoints)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Response Headers
```
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1706433600
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
```

---

## CORS Configuration

**Allowed Origins:** 
- Development: `http://localhost:5173`
- Production: Set via `FRONTEND_URL` environment variable

**Allowed Methods:**
- GET, POST, PUT, DELETE, PATCH, OPTIONS

**Allowed Headers:**
- Authorization
- Content-Type

**Credentials:** Allowed (httpOnly cookies)

---

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=5000

# URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT
JWT_SECRET=your-secret-key-change-me

# Database
DATABASE_URL=mysql://user:password@localhost:3306/dbname
```

---

## 🧪 Testing

**Swagger UI:** http://localhost:5000/api-docs/
**Postman Collection:** Import from `postman-collection.json`

**Quick Test:**
```bash
# Health check
curl http://localhost:5000/api/health

# OAuth URL
curl http://localhost:5000/api/auth/google/url

# Protected endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/calendar/events
```

---

## 📱 Frontend Integration Guide

### 1. Login Flow
```javascript
// Step 1: Redirect user to OAuth
function handleLogin() {
  window.location.href = 'http://localhost:5000/api/auth/google/url';
}

// Step 2: Handle OAuth callback (backend does this)
// User is redirected to /dashboard with accessToken in cookie

// Step 3: Make authenticated requests (cookies automatically included)
fetch('http://localhost:5000/api/calendar/events', {
  credentials: 'include'  // Important: include cookies
});
```

### 2. Token Refresh
```javascript
// If access token expires, refresh it
async function ensureValidToken() {
  const token = localStorage.getItem('refreshToken');
  if (token) {
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    }
  }
}
```

### 3. Logout
```javascript
async function handleLogout() {
  const token = localStorage.getItem('accessToken');
  await fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}
```

---

**Last Updated:** January 28, 2026
**API Version:** 1.0.0
**Status:** ✅ Production Ready
