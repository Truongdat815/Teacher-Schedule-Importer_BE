# 📋 Data Mẫu Test API - Copy & Paste

**Truy cập Swagger UI:** http://localhost:5000/api-docs

Tài liệu này chứa tất cả data mẫu để test toàn bộ API endpoints. Copy và paste trực tiếp vào Swagger UI.

---

## 🔍 1. Health Check APIs

### GET `/api/health`
- **Không cần data** - Chỉ cần click "Execute"

**Expected Response:**
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

---

## 🔐 2. Authentication APIs

### GET `/api/auth/google/url`
- **Không cần data** - Chỉ cần click "Execute"

**Expected Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET `/api/auth/google/callback`
- **Query Parameter:**
  ```
  code=4/0AeanS...your-google-oauth-code...
  ```
- **Lưu ý:** Cần code thực từ Google OAuth flow

---

## 📅 3. Events APIs

### POST `/api/events` - Tạo Event Mới

#### Data Mẫu 1: Event Đơn Giản (Minimal)
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123xyz789",
  "tabName": "Lịch học",
  "title": "Lập trình Web",
  "startTime": "2025-02-01T08:00:00Z",
  "endTime": "2025-02-01T10:00:00Z"
}
```

#### Data Mẫu 2: Event với Row Number
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123xyz789",
  "tabName": "Lịch học",
  "rowNumber": 1,
  "title": "Cơ sở dữ liệu",
  "startTime": "2025-02-01T10:30:00Z",
  "endTime": "2025-02-01T12:00:00Z"
}
```

#### Data Mẫu 3: Event với Attributes (Giảng viên, Phòng)
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123xyz789",
  "tabName": "Lịch học",
  "rowNumber": 2,
  "title": "Lập trình Web",
  "startTime": "2025-02-01T13:00:00Z",
  "endTime": "2025-02-01T15:00:00Z",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "Nguyễn Văn A",
      "role": "HOST"
    },
    {
      "key": "Phòng",
      "value": "BE-401",
      "role": null
    }
  ]
}
```

#### Data Mẫu 4: Event Đầy Đủ (Full Example)
```json
{
  "userId": "test-user-002",
  "sheetId": "1DEF456abc012",
  "tabName": "Lịch thi",
  "rowNumber": 5,
  "title": "Thi cuối kỳ - Lập trình Web",
  "startTime": "2025-02-15T13:00:00Z",
  "endTime": "2025-02-15T15:00:00Z",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "Trần Thị B",
      "role": "HOST"
    },
    {
      "key": "Phòng",
      "value": "A-201",
      "role": null
    },
    {
      "key": "Số lượng SV",
      "value": "45",
      "role": null
    },
    {
      "key": "Hình thức",
      "value": "Tự luận",
      "role": null
    }
  ]
}
```

#### Data Mẫu 5: Event Buổi Sáng
```json
{
  "userId": "test-user-003",
  "sheetId": "1GHI789def345",
  "tabName": "Lịch học",
  "rowNumber": 10,
  "title": "Thực hành Lập trình",
  "startTime": "2025-02-03T07:30:00Z",
  "endTime": "2025-02-03T09:30:00Z",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "Lê Văn C",
      "role": "HOST"
    },
    {
      "key": "Phòng Lab",
      "value": "LAB-301",
      "role": null
    }
  ]
}
```

#### Data Mẫu 6: Event Buổi Chiều
```json
{
  "userId": "test-user-003",
  "sheetId": "1GHI789def345",
  "tabName": "Lịch học",
  "rowNumber": 11,
  "title": "Đồ án Cuối kỳ",
  "startTime": "2025-02-03T14:00:00Z",
  "endTime": "2025-02-03T17:00:00Z",
  "attributes": [
    {
      "key": "Giảng viên hướng dẫn",
      "value": "Phạm Thị D",
      "role": "HOST"
    },
    {
      "key": "Phòng",
      "value": "C-501",
      "role": null
    },
    {
      "key": "Nhóm",
      "value": "Nhóm 5",
      "role": null
    }
  ]
}
```

#### Data Mẫu 7: Test Idempotency (Gửi lại cùng data)
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123xyz789",
  "tabName": "Lịch học",
  "rowNumber": 1,
  "title": "Lập trình Web",
  "startTime": "2025-02-01T08:00:00Z",
  "endTime": "2025-02-01T10:00:00Z"
}
```
**Lưu ý:** Gửi lại data này lần 2 sẽ UPDATE thay vì tạo mới (idempotent)

---

### GET `/api/events` - Lấy Tất Cả Events của User

#### Query Parameter Mẫu 1:
```
userId=test-user-001
```

#### Query Parameter Mẫu 2:
```
userId=test-user-002
```

#### Query Parameter Mẫu 3:
```
userId=test-user-003
```

---

### GET `/api/events/{id}` - Lấy Event theo ID

#### Path Parameter:
```
id=d0557623-7a98-4f34-bcad-6455cdb3c8cd
```
**Lưu ý:** Thay bằng ID thực tế từ response của POST `/api/events`

#### Test với ID không tồn tại (404 Error):
```
id=00000000-0000-0000-0000-000000000000
```

---

### PUT `/api/events/{id}` - Cập nhật Event

#### Path Parameter:
```
id=d0557623-7a98-4f34-bcad-6455cdb3c8cd
```
**Lưu ý:** Thay bằng ID thực tế từ response của POST `/api/events`

#### Data Mẫu 1: Cập nhật Title và Sync Status
```json
{
  "title": "Lập trình Web - Đã cập nhật",
  "syncStatus": "success",
  "googleEventId": "google-calendar-event-id-12345"
}
```

#### Data Mẫu 2: Cập nhật Thời Gian
```json
{
  "startTime": "2025-02-01T09:00:00Z",
  "endTime": "2025-02-01T11:00:00Z"
}
```

#### Data Mẫu 3: Cập nhật Sync Status
```json
{
  "syncStatus": "success",
  "googleEventId": "google-event-67890"
}
```

#### Data Mẫu 4: Cập nhật Title
```json
{
  "title": "Lập trình Web - Phiên bản mới"
}
```

#### Data Mẫu 5: Cập nhật Attributes
```json
{
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "Nguyễn Văn C",
      "role": "HOST"
    },
    {
      "key": "Phòng",
      "value": "BE-402",
      "role": null
    },
    {
      "key": "Ghi chú",
      "value": "Đã đổi phòng",
      "role": null
    }
  ]
}
```

#### Data Mẫu 6: Cập nhật Tất Cả
```json
{
  "title": "Cơ sở dữ liệu - Đã sửa",
  "startTime": "2025-02-01T10:00:00Z",
  "endTime": "2025-02-01T12:30:00Z",
  "syncStatus": "success",
  "googleEventId": "google-event-99999",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "Lê Thị D",
      "role": "HOST"
    },
    {
      "key": "Phòng",
      "value": "A-301",
      "role": null
    }
  ]
}
```

#### Data Mẫu 7: Đánh dấu Failed
```json
{
  "syncStatus": "failed"
}
```

---

### DELETE `/api/events/{id}` - Xóa Event

#### Path Parameter:
```
id=d0557623-7a98-4f34-bcad-6455cdb3c8cd
```
**Lưu ý:** Thay bằng ID thực tế từ response của POST `/api/events`

**Không cần Request Body** - Chỉ cần click "Execute"

---

### GET `/api/events/status` - Lấy Events theo Sync Status

#### Query Parameter Mẫu 1: Pending
```
status=pending
```

#### Query Parameter Mẫu 2: Success
```
status=success
```

#### Query Parameter Mẫu 3: Failed
```
status=failed
```

#### Test với Status không hợp lệ (400 Error):
```
status=invalid
```

---

## 🧪 Test Flow Hoàn Chỉnh - Step by Step

### Flow 1: Tạo và Quản Lý Event Cơ Bản

**Bước 1: Tạo Event Mới**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 1: Event Đơn Giản" ở trên
- **Lưu lại:** `id` từ response (ví dụ: `d0557623-7a98-4f34-bcad-6455cdb3c8cd`)

**Bước 2: Lấy Event vừa tạo**
- **Endpoint:** GET `/api/events/{id}`
- **Path Parameter:** Paste `id` từ bước 1

**Bước 3: Lấy tất cả Events của User**
- **Endpoint:** GET `/api/events?userId=test-user-001`
- **Query Parameter:** `userId=test-user-001`

**Bước 4: Cập nhật Event**
- **Endpoint:** PUT `/api/events/{id}`
- **Path Parameter:** Paste `id` từ bước 1
- **Data:** Copy "Data Mẫu 1: Cập nhật Title và Sync Status" ở trên

**Bước 5: Lấy Events theo Status**
- **Endpoint:** GET `/api/events/status?status=success`
- **Query Parameter:** `status=success`

**Bước 6: Xóa Event (Tùy chọn)**
- **Endpoint:** DELETE `/api/events/{id}`
- **Path Parameter:** Paste `id` từ bước 1

---

### Flow 2: Test với Attributes

**Bước 1: Tạo Event với Attributes**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 3: Event với Attributes" ở trên

**Bước 2: Cập nhật Attributes**
- **Endpoint:** PUT `/api/events/{id}`
- **Data:** Copy "Data Mẫu 5: Cập nhật Attributes" ở trên

---

### Flow 3: Test Idempotency

**Bước 1: Tạo Event lần 1**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 1: Event Đơn Giản" ở trên
- **Lưu lại:** `id` từ response

**Bước 2: Gửi lại cùng data (Idempotent)**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 7: Test Idempotency" ở trên
- **Kết quả:** Event sẽ được UPDATE thay vì tạo mới (cùng `id`)

---

### Flow 4: Test Multiple Users

**Bước 1: Tạo Event cho User 1**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 1" với `userId=test-user-001`

**Bước 2: Tạo Event cho User 2**
- **Endpoint:** POST `/api/events`
- **Data:** Copy "Data Mẫu 4" với `userId=test-user-002`

**Bước 3: Lấy Events của User 1**
- **Endpoint:** GET `/api/events?userId=test-user-001`

**Bước 4: Lấy Events của User 2**
- **Endpoint:** GET `/api/events?userId=test-user-002`

---

## ⚠️ Test Error Cases

### Test 1: Missing Required Fields (400 Error)
**Endpoint:** POST `/api/events`
**Data (Thiếu title):**
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123",
  "tabName": "Lịch học",
  "startTime": "2025-02-01T08:00:00Z",
  "endTime": "2025-02-01T10:00:00Z"
}
```

### Test 2: Invalid Date Format (400 Error)
**Endpoint:** POST `/api/events`
**Data (Date format sai):**
```json
{
  "userId": "test-user-001",
  "sheetId": "1ABC123",
  "tabName": "Lịch học",
  "title": "Test",
  "startTime": "2025-02-01 08:00:00",
  "endTime": "2025-02-01 10:00:00"
}
```

### Test 3: Event Not Found (404 Error)
**Endpoint:** GET `/api/events/{id}`
**Path Parameter:**
```
id=00000000-0000-0000-0000-000000000000
```

### Test 4: Invalid Status (400 Error)
**Endpoint:** GET `/api/events/status?status=invalid`

---

## 📝 Quick Copy - One Line Format

### POST `/api/events` - Minimal
```json
{"userId":"test-001","sheetId":"sheet1","tabName":"Tab1","title":"Test","startTime":"2025-02-01T10:00:00Z","endTime":"2025-02-01T11:00:00Z"}
```

### POST `/api/events` - With Attributes
```json
{"userId":"test-001","sheetId":"sheet1","tabName":"Tab1","title":"Test","startTime":"2025-02-01T10:00:00Z","endTime":"2025-02-01T11:00:00Z","attributes":[{"key":"Giảng viên","value":"Nguyễn Văn A","role":"HOST"},{"key":"Phòng","value":"BE-401","role":null}]}
```

### PUT `/api/events/{id}` - Update Status
```json
{"syncStatus":"success","googleEventId":"google-event-123"}
```

---

## ✅ Checklist Test

- [ ] POST `/api/events` - Tạo event đơn giản
- [ ] POST `/api/events` - Tạo event với attributes
- [ ] POST `/api/events` - Test idempotency (gửi lại cùng data)
- [ ] GET `/api/events?userId=xxx` - Lấy events của user
- [ ] GET `/api/events/{id}` - Lấy event theo ID
- [ ] GET `/api/events/{id}` - Test với ID không tồn tại (404)
- [ ] PUT `/api/events/{id}` - Cập nhật title
- [ ] PUT `/api/events/{id}` - Cập nhật sync status
- [ ] PUT `/api/events/{id}` - Cập nhật attributes
- [ ] GET `/api/events/status?status=pending` - Lấy events pending
- [ ] GET `/api/events/status?status=success` - Lấy events success
- [ ] GET `/api/events/status?status=failed` - Lấy events failed
- [ ] DELETE `/api/events/{id}` - Xóa event
- [ ] POST `/api/events` - Test missing fields (400 error)
- [ ] GET `/api/events/status?status=invalid` - Test invalid status (400 error)

---

## 📌 Lưu Ý Quan Trọng

1. **Format DateTime:** Phải là ISO 8601
   - ✅ Đúng: `"2025-02-01T08:00:00Z"`
   - ❌ Sai: `"2025-02-01 08:00:00"`

2. **Required Fields cho POST:**
   - `userId` (string) - **Bắt buộc**
   - `sheetId` (string) - **Bắt buộc**
   - `tabName` (string) - **Bắt buộc**
   - `title` (string) - **Bắt buộc**
   - `startTime` (ISO datetime) - **Bắt buộc**
   - `endTime` (ISO datetime) - **Bắt buộc**
   - `rowNumber` (number) - Optional, mặc định 0
   - `attributes` (array) - Optional

3. **Idempotency:**
   - Gửi cùng data POST 2 lần → Lần 2 sẽ UPDATE
   - Dựa trên `sheetRowHash` (tự động tính)

4. **User Auto-Creation:**
   - User sẽ được tự động tạo nếu chưa tồn tại
   - Email mặc định: `{userId}@temp.local`

---

**Chúc bạn test thành công! 🚀**
