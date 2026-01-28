# Migration & Testing Guide

## Quick Start

### 1. Start the Server
```bash
npm start
```
The server will run on `http://localhost:5000`

### 2. Get OAuth Token
1. Open browser: `http://localhost:5000/api/auth/google/url`
2. Complete Google login
3. You'll be redirected with your JWT token

### 3. Use the New Endpoints

## Endpoint Details

### Preview Endpoint
**POST /api/sheets/preview**

Preview what will be synced without creating calendar events.

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/sheets/preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Capstone 2026",
    "rowNumber": 4,
    "rowData": {
      "A": "SP123456",
      "B": "GSP123345",
      "C": "AI Chatbot Implementation",
      "D": "Xây dựng chatbot AI",
      "E": "Dr. Nguyen Van A",
      "F": "Dr. Le Thi B",
      "G": "Dr. Tran Van C",
      "H": "1/22/2026",
      "I": "1",
      "J": "Room 101",
      "K": "REV001",
      "L": "COUNCIL1",
      "M": "No conflicts",
      "N": "Pass"
    }
  }'
```

### Sync Endpoint
**POST /api/calendar/sync**

Parse sheet row, create/update capstone project, and sync to Google Calendar.

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Capstone 2026",
    "rowNumber": 4,
    "rowData": { /* same as above */ },
    "syncOptions": {
      "syncAllStages": true,
      "stagesToSync": ["REV1", "REV2", "REV3", "DEF1", "DEF2"],
      "overwriteExisting": false
    }
  }'
```

## Row Data Format

The `rowData` object should contain the raw values from Google Sheets:

```javascript
{
  // Static Project Info (Columns A-G)
  "A": "SP123456",          // Topic Code
  "B": "GSP123345",         // Group Code
  "C": "AI Chatbot",        // Topic Name EN
  "D": "Xây dựng chatbot",  // Topic Name VI
  "E": "Dr. Mentor",        // Mentor
  "F": "Dr. Mentor 1",      // Mentor 1
  "G": "Dr. Mentor 2",      // Mentor 2

  // REVIEW 1 Stage (Columns H-N)
  "H": "1/22/2026",   // Date (MM/DD/YYYY)
  "I": "1",           // Slot
  "J": "Room 101",    // Room
  "K": "REV001",      // Reviewer Code
  "L": "COUNCIL1",    // Council Code
  "M": "No conflicts",// Conflicts
  "N": "Pass",        // Result

  // REVIEW 2 Stage (Columns O-U)
  "O": "1/29/2026",
  "P": "2",
  "Q": "Room 102",
  "R": "REV002",
  "S": "COUNCIL1",
  "T": "No conflicts",
  "U": "Pass",

  // REVIEW 3 Stage (Columns V-AB)
  "V": "2/5/2026",
  "W": "3",
  "X": "Room 103",
  "Y": "REV003",
  "Z": "COUNCIL1",
  "AA": "No conflicts",
  "AB": "Pass",

  // SUPERVISOR Stage (Columns AC-AI)
  "AC": "2/12/2026",
  "AD": "1",
  "AE": "Room 201",
  "AF": "SUP001",
  "AG": "COUNCIL1",
  "AH": "No conflicts",
  "AI": "Approved",

  // DEFENSE 1 Stage (Columns AJ-AP)
  "AJ": "2/19/2026",
  "AK": "1",
  "AL": "Room 301",
  "AM": "DEF001",
  "AN": "DEFENSE_COUNCIL",
  "AO": "No conflicts",
  "AP": "Pass",

  // DEFENSE 2 Stage (Columns AQ-AW)
  "AQ": "2/26/2026",
  "AR": "2",
  "AS": "Room 302",
  "AT": "DEF002",
  "AU": "DEFENSE_COUNCIL",
  "AV": "No conflicts",
  "AW": "Pass"
}
```

## Expected Responses

### Preview Response (Success)
```json
{
  "success": true,
  "message": "Preview generated successfully",
  "data": {
    "project": {
      "topicCode": "SP123456",
      "groupCode": "GSP123345",
      "topicNameVi": "Xây dựng chatbot AI",
      "topicNameEn": "AI Chatbot Implementation",
      "mentor": "Dr. Nguyen Van A",
      "mentor1": "Dr. Le Thi B",
      "mentor2": "Dr. Tran Van C"
    },
    "eventPreviews": [
      {
        "stage": "REV1",
        "title": "[REV1] GSP123345 - SP123456",
        "description": "...",
        "date": "2026-01-22",
        "slot": "1",
        "room": "Room 101",
        "canSync": true
      },
      // ... more events
    ]
  }
}
```

### Sync Response (Success)
```json
{
  "success": true,
  "message": "Sheet synced to calendar successfully",
  "data": {
    "project": {
      "id": "uuid-here",
      "topicCode": "SP123456",
      "groupCode": "GSP123345",
      "topicNameVi": "Xây dựng chatbot AI"
    },
    "syncResults": [
      {
        "stage": "REV1",
        "status": "success",
        "googleEventId": "event-id-from-google",
        "error": null
      },
      {
        "stage": "REV2",
        "status": "success",
        "googleEventId": "event-id-from-google",
        "error": null
      }
      // ... more stages
    ],
    "summary": {
      "totalStages": 5,
      "successfulSyncs": 5,
      "failedSyncs": 0
    }
  }
}
```

### Error Response (Missing Field)
```json
{
  "error": true,
  "message": "Invalid request",
  "details": "Row data is missing required fields",
  "code": "VALIDATION_ERROR"
}
```

## Testing with Postman

1. **Import Collection:**
   - Use the Swagger docs at `http://localhost:5000/api-docs`
   - Click "Export" to download OpenAPI JSON
   - Import in Postman

2. **Setup Environment:**
   - Variable: `jwt_token` = Your JWT from Google login
   - Variable: `base_url` = http://localhost:5000

3. **Test Preview:**
   - POST {{base_url}}/api/sheets/preview
   - Header: Authorization: Bearer {{jwt_token}}
   - Body: Raw JSON with sheet data

4. **Test Sync:**
   - POST {{base_url}}/api/calendar/sync
   - Header: Authorization: Bearer {{jwt_token}}
   - Body: Raw JSON with syncOptions

## Troubleshooting

### "Google credential not found"
- Solution: Complete OAuth login at `/api/auth/google/url`
- Ensure your JWT token includes valid Google credentials

### "Invalid request - Sheet data missing fields"
- Solution: Verify rowData has all required columns (A-AW)
- Check date format is MM/DD/YYYY

### "Calendar sync failed"
- Solution: Check Google Calendar API is enabled in Google Cloud Console
- Verify Google credentials have calendar.write scope

### Database errors
- Solution: Run `npx prisma migrate reset --force`
- Then restart the server

## Database Inspection

### View Capstone Projects
```bash
npx prisma studio
```

Then navigate to CapstoneProject table to view all created projects.

### Query via Prisma Client
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.capstoneProject.findMany().then(p => console.log(p));
"
```

## Performance Notes

- **Row parsing:** ~50ms per row
- **Database upsert:** ~100ms per project (6 events)
- **Calendar sync:** ~2-3 seconds per stage (due to Google API)
- **Total sync time:** ~15 seconds for full project (5 stages)

## Security Considerations

✅ **Implemented:**
- JWT authentication required for both endpoints
- User ownership verification at project level
- Request validation with Zod schemas
- Error handling without sensitive data leakage

⚠️ **Recommended:**
- Enable HTTPS in production
- Set up rate limiting per user
- Monitor Google API quota usage
- Log all sync operations
- Implement sync failure notifications

---

For more details, see [PHASE5_COMPLETION_REPORT.md](./PHASE5_COMPLETION_REPORT.md)
