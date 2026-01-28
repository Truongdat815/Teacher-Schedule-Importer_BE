# 🔍 Google Login Flow - Issues Found & Solutions

## Issues Identified

### ❌ Issue 1: Mismatch in Environment Variable Names
**Location:** `src/controllers/authController.ts` line 11  
**Problem:**
```typescript
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI  // ⚠️ WRONG!
);
```

**But in .env file:**
```
GOOGLE_REDIRECT_URI="http://localhost:5173/callback"
```

**Expected in authController:**
```typescript
process.env.GOOGLE_REDIRECT_URI  // ✅ This is correct in code
```

**Actual in .env:**
```
GOOGLE_REDIRECT_URI=  // ⚠️ Inconsistent naming (should be GOOGLE_CALLBACK_URL or vice versa)
```

---

### ❌ Issue 2: Frontend Callback URL Mismatch
**Problem:**
- `.env` has: `GOOGLE_REDIRECT_URI="http://localhost:5173/callback"`
- But backend is running on `http://localhost:5000`
- Frontend callback should be where the frontend is, not the backend!

**Current Flow:**
```
1. Frontend calls: GET /api/auth/google/url
2. Backend returns: Google Auth URL with redirect to http://localhost:5173/callback ❌
3. User completes Google login
4. Google redirects to http://localhost:5173/callback (Frontend) ✅
5. But then what? Frontend doesn't send code to backend!
```

**Issue:** The redirect_uri in Google OAuth must match where Google will send the code. If it's set to frontend (5173), the frontend needs to handle catching the code and sending it to the backend.

---

### ❌ Issue 3: OAuth Code Exchange Missing from Frontend
**Problem:** There's no clear mechanism for frontend to:
1. Catch the authorization code from Google redirect
2. Send it to backend's `/api/auth/google/callback`

**Current backend expects:**
```typescript
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    const { tokens } = await oauth2Client.getToken(req.query.code as string);
    // ...
}
```

**But:** If GOOGLE_REDIRECT_URI points to frontend, the frontend needs to:
1. Extract `code` from URL query params
2. POST it to `/api/auth/google/callback?code=AUTH_CODE`

---

### ❌ Issue 4: Environment Variable Consistency
**Problem:** In authController.ts:
```typescript
process.env.GOOGLE_REDIRECT_URI  // ✅ Correct name
```

**But:** This env var might not be set or might be undefined, causing OAuth to fail silently.

**In .env it should be:**
```
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

OR keep current naming but be consistent everywhere.

---

## Recommended Solutions

### ✅ Solution 1: Backend-Handled OAuth (Recommended)

Change the flow to:
1. Frontend sends user to: `GET /api/auth/google/url`
2. Backend returns redirect to Google (with backend callback URL)
3. Google redirects back to: `http://localhost:5000/api/auth/google/callback?code=AUTH_CODE`
4. Backend processes and returns JWT tokens
5. Frontend receives tokens

**Changes needed:**

#### Step 1: Update .env
```env
# Change from:
GOOGLE_REDIRECT_URI="http://localhost:5173/callback"

# To:
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

#### Step 2: Update authController.ts
```typescript
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL  // Changed from GOOGLE_REDIRECT_URI
);
```

#### Step 3: Update getAuthUrl to redirect user
```typescript
export const getAuthUrl = (req: Request, res: Response) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });

    // Redirect user directly to Google (don't return URL)
    res.redirect(url);
};
```

#### Step 4: Update googleCallback to redirect after success
```typescript
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code as string);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new BadRequestError('Email not found in Google profile');
        }

        const user = await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || 'Unknown',
            userInfo.data.picture || '',
            userInfo.data.id,
            tokens
        );

        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Redirect to frontend with tokens in URL or cookie
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(
            `${frontendUrl}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );

    } catch (error) {
        next(error);
    }
};
```

---

### ✅ Solution 2: Frontend-Initiated OAuth (Alternative)

If you want frontend to handle OAuth:

1. Frontend initiates OAuth directly with Google (uses @react-oauth/google or similar)
2. Frontend receives id_token from Google
3. Frontend sends id_token to backend's verify endpoint
4. Backend validates id_token and creates/updates user

This requires:
- Removing backend OAuth2 logic
- Adding id_token validation in backend
- Installing frontend OAuth library

---

## Complete Google Login Flow Audit

### Current Architecture Issues:
```
❌ GOOGLE_REDIRECT_URI points to frontend (wrong)
❌ getAuthUrl returns URL instead of redirecting
❌ No way for frontend to send code back to backend
❌ Inconsistent env variable names
❌ No callback handling in frontend
❌ Security issue: tokens in URL query params (for solution 1 redirect)
```

### Issues in Code:

1. **authController.ts line 11:** Uses `GOOGLE_REDIRECT_URI` which might not exist
2. **authController.ts line 35:** Returns JSON with URL instead of redirecting
3. **authController.ts line 43:** Expects code in query, but no frontend sends it
4. **.env:** Has undefined/wrong redirect URI
5. **No frontend error handling:** If callback fails, no way to show error

---

## Recommended Fix (Quick Implementation)

Replace these in authController.ts:

### Before:
```typescript
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });

    res.json({ success: true, url });  // ❌ Returns URL
};
```

### After:
```typescript
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
);

export const getAuthUrl = (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });

    res.redirect(url);  // ✅ Redirects to Google
};
```

And update googleCallback:
```typescript
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code as string);
        // ... existing code ...
        
        // After generating tokens:
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Store tokens in httpOnly cookie instead of URL
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        
        res.redirect(`${frontendUrl}/dashboard?success=true`);
    } catch (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
};
```

---

## Environment Variables to Add/Update

```env
# Google OAuth - IMPORTANT: These must match your Google Cloud Console settings
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:5173"

# JWT
JWT_SECRET="dev-secret-key-change-in-production-min-32-chars-long"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Database
DATABASE_URL="postgresql://..."

# Node environment
NODE_ENV="development"
```

---

## Summary of Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| GOOGLE_REDIRECT_URI env var wrong | 🔴 Critical | Change to GOOGLE_CALLBACK_URL or update code |
| getAuthUrl returns URL instead of redirect | 🔴 Critical | Change `res.json()` to `res.redirect()` |
| No frontend callback handler | 🔴 Critical | Add code exchange endpoint or frontend OAuth |
| Tokens exposed in URL | 🟠 High | Use httpOnly cookies |
| Missing BACKEND_URL/FRONTEND_URL config | 🟠 High | Add to .env |

---

**Would you like me to implement these fixes?**
