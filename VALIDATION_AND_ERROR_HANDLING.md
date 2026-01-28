# Validation và Exception Handling Documentation

Tài liệu này mô tả hệ thống validation và exception handling đã được implement trong project.

## 📋 Tổng quan

Project đã được implement đầy đủ:
- ✅ **Zod Validation Schemas** - Validation cho tất cả endpoints
- ✅ **Global Error Handler** - Xử lý errors tập trung
- ✅ **Custom Exception Classes** - Các loại exception riêng
- ✅ **Validation Middleware** - Middleware tự động validate requests
- ✅ **Database Constraints** - Ràng buộc ở database level

---

## 🔍 Validation Schemas

### Location: `src/validations/`

#### 1. Event Validation (`eventValidation.ts`)

**Schemas:**
- `createEventSchema` - Validate POST `/api/events`
- `updateEventSchema` - Validate PUT `/api/events/:id`
- `getEventsQuerySchema` - Validate GET `/api/events?userId=xxx`
- `getEventByIdParamsSchema` - Validate GET `/api/events/:id`
- `eventIdParamsSchema` - Validate PUT/DELETE `/api/events/:id`
- `getEventsByStatusQuerySchema` - Validate GET `/api/events/status?status=xxx`

**Validation Rules:**
- ✅ Required fields check
- ✅ String length validation (title max 500 chars)
- ✅ Date format validation (ISO 8601)
- ✅ Date logic validation (endTime > startTime)
- ✅ Enum validation (syncStatus: pending, success, failed)
- ✅ UUID validation cho event IDs
- ✅ Number validation (rowNumber >= 0)
- ✅ Attributes array validation

#### 2. Auth Validation (`authValidation.ts`)

**Schemas:**
- `googleCallbackQuerySchema` - Validate GET `/api/auth/google/callback?code=xxx`

**Validation Rules:**
- ✅ Required code parameter
- ✅ String validation

---

## 🛡️ Custom Exception Classes

### Location: `src/utils/errors.ts`

**Exception Classes:**
- `AppError` - Base error class
- `BadRequestError` (400) - Invalid request
- `UnauthorizedError` (401) - Authentication required
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflict
- `ValidationError` (400) - Validation failed
- `DatabaseError` (500) - Database operation failed

**Usage:**
```typescript
throw new NotFoundError('Event not found');
throw new ValidationError('Invalid data format');
throw new UnauthorizedError('User ID is required');
```

---

## 🔧 Validation Middleware

### Location: `src/middleware/validation.ts`

**Function:** `validate(schema)`

**Usage:**
```typescript
router.post(
  '/events',
  validate({ body: createEventSchema }),
  eventController.createOrUpdateEvent
);
```

**Features:**
- ✅ Validate request body
- ✅ Validate query parameters
- ✅ Validate path parameters
- ✅ Auto-parse và type-safe
- ✅ Return detailed validation errors

---

## 🚨 Global Error Handler

### Location: `src/middleware/errorHandler.ts`

**Functions:**
- `errorHandler` - Global error handler middleware
- `notFoundHandler` - 404 handler

**Error Types Handled:**

1. **Zod Validation Errors**
   ```json
   {
     "success": false,
     "error": "Validation Error",
     "message": "Invalid request data",
     "details": [
       {
         "field": "startTime",
         "message": "Invalid start time format..."
       }
     ]
   }
   ```

2. **Prisma Errors**
   - `P2002` - Unique constraint violation (409)
   - `P2025` - Record not found (404)
   - `P2003` - Foreign key violation (400)
   - `P2014` - Required relation missing (400)

3. **Custom App Errors**
   ```json
   {
     "success": false,
     "error": "NotFoundError",
     "message": "Event not found",
     "code": "EVENT_NOT_FOUND"
   }
   ```

4. **Unknown Errors**
   ```json
   {
     "success": false,
     "error": "Internal Server Error",
     "message": "An unexpected error occurred"
   }
   ```

---

## 📊 Database Constraints

### Location: `prisma/schema.prisma`

**Constraints:**
- ✅ Primary Keys (`@id`)
- ✅ Unique Constraints (`@unique`)
- ✅ Foreign Keys (`@relation`)
- ✅ Cascade Delete (`onDelete: Cascade`)
- ✅ Default Values (`@default()`)
- ✅ Indexes (`@@index`)

**Examples:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  // ...
}

model EventMapping {
  sheetRowHash String @unique
  // ...
}

model EventAttribute {
  eventMapping   EventMapping @relation(..., onDelete: Cascade)
  @@index([eventMappingId])
}
```

---

## 🎯 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "startTime",
      "message": "Invalid date format"
    }
  ]
}
```

---

## 📝 Validation Examples

### Example 1: Invalid Date Format
**Request:**
```json
{
  "userId": "user-123",
  "sheetId": "sheet1",
  "tabName": "Tab1",
  "title": "Test",
  "startTime": "2025-02-01 08:00:00",
  "endTime": "2025-02-01 10:00:00"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "startTime",
      "message": "Invalid start time format. Use ISO 8601 format (e.g., 2025-02-01T08:00:00Z)"
    }
  ]
}
```

### Example 2: Missing Required Field
**Request:**
```json
{
  "userId": "user-123",
  "sheetId": "sheet1"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "tabName",
      "message": "Tab name is required"
    },
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "startTime",
      "message": "Required"
    },
    {
      "field": "endTime",
      "message": "Required"
    }
  ]
}
```

### Example 3: Invalid Enum Value
**Request:**
```
GET /api/events/status?status=invalid
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "status",
      "message": "Status must be one of: pending, success, failed"
    }
  ]
}
```

### Example 4: Invalid UUID
**Request:**
```
GET /api/events/not-a-uuid
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "id",
      "message": "Invalid event ID format"
    }
  ]
}
```

### Example 5: End Time Before Start Time
**Request:**
```json
{
  "userId": "user-123",
  "sheetId": "sheet1",
  "tabName": "Tab1",
  "title": "Test",
  "startTime": "2025-02-01T10:00:00Z",
  "endTime": "2025-02-01T08:00:00Z"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "endTime",
      "message": "End time must be after start time"
    }
  ]
}
```

---

## 🔄 Error Flow

```
Request → Validation Middleware → Controller → Service → Database
                ↓ (if invalid)
         Validation Error → Error Handler → Response
                ↓ (if error)
         Exception → Error Handler → Response
```

---

## ✅ Checklist Validation

- [x] Required fields validation
- [x] Data type validation (string, number, date)
- [x] Format validation (ISO 8601, UUID)
- [x] Range validation (min, max)
- [x] Enum validation (syncStatus)
- [x] Business logic validation (endTime > startTime)
- [x] Query parameter validation
- [x] Path parameter validation
- [x] Request body validation
- [x] Custom error messages
- [x] Detailed error responses

---

## 🎓 Best Practices

1. **Always use validation middleware** - Không validate thủ công trong controllers
2. **Use custom exceptions** - Throw custom errors thay vì generic errors
3. **Let error handler do its job** - Không try-catch trong controllers (trừ khi cần)
4. **Provide clear error messages** - Error messages phải rõ ràng, dễ hiểu
5. **Validate at multiple levels** - Database constraints + Application validation

---

## 📚 Files Created/Modified

### New Files:
- `src/validations/eventValidation.ts` - Event validation schemas
- `src/validations/authValidation.ts` - Auth validation schemas
- `src/utils/errors.ts` - Custom exception classes
- `src/middleware/validation.ts` - Validation middleware
- `src/middleware/errorHandler.ts` - Global error handler

### Modified Files:
- `src/app.ts` - Added error handlers
- `src/routes.ts` - Added validation middleware
- `src/controllers/eventController.ts` - Refactored to use new error handling
- `src/controllers/authController.ts` - Refactored to use new error handling
- `src/controllers/healthController.ts` - Updated response format

---

**Validation và Exception Handling đã được implement đầy đủ! 🎉**
