# 📋 Hướng Dẫn Test API Hoàn Chỉnh - Từng Bước Chi Tiết

**🌐 Truy cập Swagger UI:** http://localhost:5000/api-docs

> **📌 Tài liệu này hướng dẫn bạn test toàn bộ API từ đầu đến cuối, bao gồm authentication, authorization, và tất cả các endpoints với data mẫu chuẩn.**

---

## 🎯 Mục Lục

1. [Khởi động và Truy cập Swagger](#1-khởi-động-và-truy-cập-swagger)
2. [Authentication Flow - Đăng nhập Google](#2-authentication-flow)
3. [Cách sử dụng Bearer Token trong Swagger](#3-cách-sử-dụng-bearer-token)
4. [Test Health Check](#4-health-check-apis)
5. [Test Event APIs - CRUD đầy đủ](#5-event-apis)
6. [Test Cases đặc biệt](#6-test-cases-đặc-biệt)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. 🚀 Khởi động và Truy cập Swagger

### Bước 1.1: Khởi động Server

```bash
# Đảm bảo database đang chạy
# Sau đó khởi động server
npm run dev
```

**Kết quả mong đợi:**
```
Server is running on port 5000
✓ Connected to database
```

### Bước 1.2: Truy cập Swagger UI

Mở trình duyệt và truy cập: **http://localhost:5000/api-docs**

Bạn sẽ thấy giao diện Swagger UI với danh sách tất cả các endpoints:
- 🟢 **Health** - 1 endpoint
- 🔐 **Auth** - 3 endpoints  
- 📅 **Events** - 6 endpoints

---

## 2. 🔐 Authentication Flow - Đăng nhập Google

### ⚠️ QUAN TRỌNG: Tất cả Event APIs đều yêu cầu Authentication!

API này sử dụng **Google OAuth 2.0** để xác thực người dùng. Bạn PHẢI đăng nhập trước khi test các Event APIs.

### 🔑 Quy trình Authentication (3 bước)

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│ 1. Get Auth URL │ ---> │ 2. Login     │ ---> │ 3. Get Tokens   │
│    (API)        │      │    (Browser) │      │    (Callback)   │
└─────────────────┘      └──────────────┘      └─────────────────┘
```

```

---

### Bước 2.1: Lấy Google Auth URL

**Endpoint:** `GET /api/auth/google/url`

**Thao tác trong Swagger:**
1. Tìm endpoint **GET /api/auth/google/url** trong section **Auth**
2. Click nút **"Try it out"**
3. Click nút **"Execute"**

**Response thành công (200):**
```json
{
  "success": true,
  "url": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile..."
}
```

**📝 Lưu lại URL này!** Bạn sẽ cần nó ở bước tiếp theo.

---

### Bước 2.2: Đăng nhập Google (Browser)

**⚠️ Bước này diễn ra NGOÀI Swagger - trên trình duyệt**

1. **Copy URL** từ response ở bước 2.1
2. **Mở tab mới** trong trình duyệt
3. **Paste và truy cập** URL đó
4. **Đăng nhập** bằng tài khoản Google của bạn
5. **Cho phép quyền truy cập** khi Google yêu cầu:
   - ✅ Xem thông tin cá nhân
   - ✅ Truy cập Google Calendar
   - ✅ Đọc Google Sheets

**Sau khi đồng ý, bạn sẽ được redirect về:**
```
http://localhost:5000/api/auth/google/callback?code=4/0AeanS0...xyz...
```

**📝 Copy phần `code=...` sau dấu `?`** 

Ví dụ: `4/0AeanS0_hQ7xPv3...`

---

### Bước 2.3: Lấy Access Token và Refresh Token

**Endpoint:** `GET /api/auth/google/callback`

**Thao tác trong Swagger:**
1. Tìm endpoint **GET /api/auth/google/callback**
2. Click **"Try it out"**
3. Nhập **code** vào ô **"code"** parameter
   ```
   4/0AeanS0_hQ7xPv3...
   ```
4. Click **"Execute"**

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHk4eHl6MTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA2NDU2Nzg5LCJleHAiOjE3MDY0NjAzODl9.abc123xyz...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHk4eHl6MTIzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDY0NTY3ODksImV4cCI6MTcwOTAzODc4OX0.def456uvw...",
    "user": {
      "id": "cly8xyz123",
      "email": "user@example.com",
      "name": "Nguyen Van A"
    }
  }
}
```

**🎉 QUAN TRỌNG: Copy `accessToken` này!** Bạn sẽ dùng nó cho TẤT CẢ các Event APIs.

---

## 3. 🔓 Cách sử dụng Bearer Token trong Swagger

### Bước 3.1: Authenticate trong Swagger UI

Sau khi có `accessToken`, bạn cần "đăng nhập" vào Swagger UI:

1. **Tìm nút 🔒 "Authorize"** ở góc trên bên phải Swagger UI
2. **Click vào nút "Authorize"**
3. Một popup hiện ra với title **"Available authorizations"**
4. Trong ô **"Value"**, nhập theo format:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   **⚠️ Chú ý:** Phải có chữ **"Bearer "** (có dấu cách) trước token!

5. Click nút **"Authorize"**
6. Click nút **"Close"**

**✅ Giờ bạn đã được xác thực!** Icon 🔒 sẽ chuyển thành 🔓

### Bước 3.2: Kiểm tra Token có hợp lệ

Sau khi Authorize, các endpoint có icon 🔒 sẽ tự động gửi token trong header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lưu ý về Token Expiry:**
- **Access Token:** Hết hạn sau **1 giờ**
- **Refresh Token:** Hết hạn sau **30 ngày**
- Khi access token hết hạn, dùng refresh token để lấy token mới

---

### Bước 3.3: Refresh Token khi hết hạn

**Endpoint:** `POST /api/auth/refresh`

**Khi nào cần dùng:**
- Access token hết hạn (sau 1 giờ)
- API trả về lỗi 401 "Invalid or expired token"

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHk4eHl6MTIzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDY0NTY3ODksImV4cCI6MTcwOTAzODc4OX0.def456uvw..."
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_REFRESH_TOKEN..."
  }
}
```

**Sau đó:**
1. Copy `accessToken` mới
2. Click nút **"Authorize"** lại
3. Cập nhật token mới vào

---

## 4. 🏥 Health Check APIs

### GET `/api/health` - Kiểm tra Server

**Mục đích:** Kiểm tra xem API server có đang chạy tốt không

**⚠️ Không cần Authentication**

**Thao tác:**
1. Click **"Try it out"**
2. Click **"Execute"**

**Response (200):**
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

---

## 5. 📅 Event APIs - CRUD Hoàn Chỉnh

### ⚠️ Tất cả Event APIs đều cần Authentication!

Đảm bảo bạn đã:
- ✅ Hoàn thành [Bước 2: Authentication Flow](#2-authentication-flow)
- ✅ Hoàn thành [Bước 3: Authorize trong Swagger](#3-cách-sử-dụng-bearer-token)

---

### 5.1. POST `/api/events` - Tạo Event Mới

**Mục đích:** Tạo hoặc cập nhật event mapping từ Google Sheets sang Calendar

**🔐 Yêu cầu:** Bearer Token

**Request Body - Data Mẫu 1: Event Cơ Bản**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Lịch Học Kỳ 1",
  "rowNumber": 2,
  "title": "Lập Trình Web - Buổi 1",
  "startTime": "2026-02-05T07:00:00.000Z",
  "endTime": "2026-02-05T09:00:00.000Z"
}
```

**Request Body - Data Mẫu 2: Event với Giảng Viên và Phòng**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Lịch Học Kỳ 1",
  "rowNumber": 3,
  "title": "Cơ Sở Dữ Liệu - Lý Thuyết",
  "startTime": "2026-02-05T09:30:00.000Z",
  "endTime": "2026-02-05T11:30:00.000Z",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "TS. Nguyễn Văn A",
      "role": "HOST"
    },
    {
      "key": "Phòng học",
      "value": "BE-401",
      "role": null
    }
  ]
}
```

**Request Body - Data Mẫu 3: Event Thực Hành Lab**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Lịch Học Kỳ 1",
  "rowNumber": 5,
  "title": "Thực Hành Lập Trình Web",
  "startTime": "2026-02-06T13:00:00.000Z",
  "endTime": "2026-02-06T16:00:00.000Z",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "ThS. Trần Thị B",
      "role": "HOST"
    },
    {
      "key": "Phòng lab",
      "value": "LAB-305",
      "role": null
    },
    {
      "key": "Máy tính",
      "value": "30 máy",
      "role": null
    }
  ]
}
```

**Request Body - Data Mẫu 4: Lịch Thi Cuối Kỳ**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Lịch Thi",
  "rowNumber": 1,
  "title": "Thi Cuối Kỳ - Lập Trình Web",
  "startTime": "2026-02-20T07:00:00.000Z",
  "endTime": "2026-02-20T09:00:00.000Z",
  "attributes": [
    {
      "key": "Giám thị 1",
      "value": "TS. Lê Văn C",
      "role": "HOST"
    },
    {
      "key": "Giám thị 2",
      "value": "ThS. Phạm Thị D",
      "role": "HOST"
    },
    {
      "key": "Phòng thi",
      "value": "A-201",
      "role": null
    },
    {
      "key": "Số sinh viên",
      "value": "45",
      "role": null
    },
    {
      "key": "Hình thức",
      "value": "Tự luận + Thực hành",
      "role": null
    }
  ]
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "cly8abc123xyz456",
    "userId": "cly8xyz123",
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Lịch Học Kỳ 1",
    "rowNumber": 2,
    "title": "Lập Trình Web - Buổi 1",
    "startTime": "2026-02-05T07:00:00.000Z",
    "endTime": "2026-02-05T09:00:00.000Z",
    "googleEventId": null,
    "syncStatus": "pending",
    "sheetRowHash": "hash_value_here",
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:30:00.000Z",
    "attributes": []
  }
}
```

**📝 Lưu lại `id` của event!** Bạn sẽ dùng nó cho các API khác.

**💡 Tính năng Idempotency:**
- Nếu bạn gửi lại request với **cùng sheetId, tabName, rowNumber** → API sẽ **UPDATE** thay vì tạo mới
- Điều này giúp tránh tạo duplicate events

---

### 5.2. GET `/api/events` - Lấy Tất Cả Events

**Mục đích:** Lấy danh sách tất cả events của người dùng hiện tại

**🔐 Yêu cầu:** Bearer Token

**Thao tác:**
1. Click **"Try it out"**
2. Click **"Execute"** (không cần nhập gì)

**Thao tác:**
1. Click **"Try it out"**
2. Click **"Execute"** (không cần nhập gì)

**Response thành công (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cly8abc123xyz456",
      "userId": "cly8xyz123",
      "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "tabName": "Lịch Học Kỳ 1",
      "rowNumber": 2,
      "title": "Lập Trình Web - Buổi 1",
      "startTime": "2026-02-05T07:00:00.000Z",
      "endTime": "2026-02-05T09:00:00.000Z",
      "googleEventId": null,
      "syncStatus": "pending",
      "createdAt": "2026-01-28T10:30:00.000Z",
      "updatedAt": "2026-01-28T10:30:00.000Z",
      "attributes": []
    },
    {
      "id": "cly8def789abc012",
      "userId": "cly8xyz123",
      "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "tabName": "Lịch Học Kỳ 1",
      "rowNumber": 3,
      "title": "Cơ Sở Dữ Liệu - Lý Thuyết",
      "startTime": "2026-02-05T09:30:00.000Z",
      "endTime": "2026-02-05T11:30:00.000Z",
      "googleEventId": "google_cal_event_123",
      "syncStatus": "success",
      "createdAt": "2026-01-28T10:35:00.000Z",
      "updatedAt": "2026-01-28T11:00:00.000Z",
      "attributes": [
        {
          "id": "attr1",
          "key": "Giảng viên",
          "value": "TS. Nguyễn Văn A",
          "role": "HOST"
        },
        {
          "id": "attr2",
          "key": "Phòng học",
          "value": "BE-401",
          "role": null
        }
      ]
    }
  ]
}
```

---

### 5.3. GET `/api/events/{id}` - Lấy Event Theo ID

**Mục đích:** Lấy chi tiết một event cụ thể

**🔐 Yêu cầu:** Bearer Token + Phải là owner của event

**Path Parameter:**
```
id = cly8abc123xyz456
```
*(Thay bằng ID thực tế từ response của POST `/api/events`)*

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "id": "cly8abc123xyz456",
    "userId": "cly8xyz123",
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Lịch Học Kỳ 1",
    "rowNumber": 2,
    "title": "Lập Trình Web - Buổi 1",
    "startTime": "2026-02-05T07:00:00.000Z",
    "endTime": "2026-02-05T09:00:00.000Z",
    "googleEventId": null,
    "syncStatus": "pending",
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:30:00.000Z",
    "attributes": []
  }
}
```

**Response lỗi - Event không tồn tại (404):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Event not found"
}
```

**Response lỗi - Không có quyền truy cập (403):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this event"
}
```

---

### 5.4. GET `/api/events/status` - Lấy Events Theo Trạng Thái Đồng Bộ

**Mục đích:** Lấy danh sách events theo trạng thái sync (pending/success/failed)

**🔐 Yêu cầu:** Bearer Token

**Query Parameter - Mẫu 1: Pending (Đang chờ đồng bộ)**
```
status = pending
```

**Query Parameter - Mẫu 2: Success (Đã đồng bộ thành công)**
```
status = success
```

**Query Parameter - Mẫu 3: Failed (Đồng bộ thất bại)**
```
status = failed
```

**Response thành công (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cly8abc123xyz456",
      "title": "Lập Trình Web - Buổi 1",
      "syncStatus": "pending",
      "startTime": "2026-02-05T07:00:00.000Z",
      "endTime": "2026-02-05T09:00:00.000Z"
    }
  ]
}
```

---

### 5.5. PUT `/api/events/{id}` - Cập Nhật Event

**Mục đích:** Cập nhật thông tin event (title, time, sync status, attributes)

**🔐 Yêu cầu:** Bearer Token + Phải là owner của event

**Path Parameter:**
```
id = cly8abc123xyz456
```

**Request Body - Mẫu 1: Cập nhật Sync Status (sau khi đồng bộ thành công)**
```json
{
  "syncStatus": "success",
  "googleEventId": "abc123xyz_google_calendar_event_id"
}
```

**Request Body - Mẫu 2: Cập nhật Title**
```json
{
  "title": "Lập Trình Web - Buổi 1 (Đã sửa)"
}
```

**Request Body - Mẫu 3: Cập nhật Thời gian**
```json
{
  "startTime": "2026-02-05T08:00:00.000Z",
  "endTime": "2026-02-05T10:00:00.000Z"
}
```

**Request Body - Mẫu 4: Cập nhật Attributes**
```json
{
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "TS. Nguyễn Văn B (Thay thế)",
      "role": "HOST"
    },
    {
      "key": "Phòng học",
      "value": "BE-402",
      "role": null
    },
    {
      "key": "Ghi chú",
      "value": "Đã đổi phòng do bảo trì",
      "role": null
    }
  ]
}
```

**Request Body - Mẫu 5: Đánh dấu Failed**
```json
{
  "syncStatus": "failed"
}
```

**Request Body - Mẫu 6: Cập nhật Toàn Bộ**
```json
{
  "title": "Lập Trình Web - Buổi 1 (Updated)",
  "startTime": "2026-02-05T08:00:00.000Z",
  "endTime": "2026-02-05T10:00:00.000Z",
  "syncStatus": "success",
  "googleEventId": "new_google_event_id_xyz",
  "attributes": [
    {
      "key": "Giảng viên",
      "value": "TS. Lê Văn C",
      "role": "HOST"
    },
    {
      "key": "Phòng học",
      "value": "BE-501",
      "role": null
    }
  ]
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": "cly8abc123xyz456",
    "userId": "cly8xyz123",
    "title": "Lập Trình Web - Buổi 1 (Updated)",
    "startTime": "2026-02-05T08:00:00.000Z",
    "endTime": "2026-02-05T10:00:00.000Z",
    "syncStatus": "success",
    "googleEventId": "new_google_event_id_xyz",
    "updatedAt": "2026-01-28T11:30:00.000Z",
    "attributes": [...]
  }
}
```

---

### 5.6. DELETE `/api/events/{id}` - Xóa Event

**Mục đích:** Xóa event khỏi database

**🔐 Yêu cầu:** Bearer Token + Phải là owner của event

**Path Parameter:**
```
id = cly8abc123xyz456
```

**Thao tác:**
1. Click **"Try it out"**
2. Nhập **id** vào ô path parameter
3. Click **"Execute"**
4. **Không cần Request Body**

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**⚠️ Lưu ý:** Event sẽ bị xóa VĨNH VIỄN khỏi database!

---

## 6. 🧪 Test Cases Đặc Biệt

### 6.1. Test Idempotency (Tính Idempotent)

**Mục đích:** Kiểm tra xem API có tạo duplicate events không

**Bước 1:** Tạo event lần đầu
```json
{
  "sheetId": "1TEST_IDEMPOTENT",
  "tabName": "Test Tab",
  "rowNumber": 1,
  "title": "Test Idempotency",
  "startTime": "2026-02-10T10:00:00.000Z",
  "endTime": "2026-02-10T12:00:00.000Z"
}
```
**Lưu lại `id` từ response**, ví dụ: `cly8test123`

**Bước 2:** Gửi lại CHÍNH XÁC cùng data trên

**Kết quả mong đợi:**
- Response trả về **CÙNG `id`** như lần đầu (`cly8test123`)
- Event bị **UPDATE** thay vì tạo mới
- Không có duplicate trong database

---

### 6.2. Test Authorization - Truy cập Event của người khác

**Mục đích:** Kiểm tra authorization có hoạt động không

**Bước 1:** Đăng nhập bằng User A, tạo event
**Bước 2:** Lấy `id` của event vừa tạo
**Bước 3:** Đăng xuất, đăng nhập bằng User B
**Bước 4:** Thử GET/PUT/DELETE event của User A bằng `id` đó

**Kết quả mong đợi:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this event"
}
```

---

### 6.3. Test Validation Errors

**Test 1: Missing Required Fields**
```json
{
  "sheetId": "123",
  "tabName": "Tab",
  "title": "Test"
  // Thiếu startTime và endTime
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Validation failed",
  "details": [
    {
      "field": "startTime",
      "message": "startTime is required"
    },
    {
      "field": "endTime",
      "message": "endTime is required"
    }
  ]
}
```

**Test 2: Invalid Date Format**
```json
{
  "sheetId": "123",
  "tabName": "Tab",
  "title": "Test",
  "startTime": "2026-02-10 10:00:00",  // Sai format
  "endTime": "2026-02-10 12:00:00"      // Sai format
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid datetime format. Expected ISO 8601"
}
```

**Test 3: Invalid Status**
```
GET /api/events/status?status=invalid_status
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid status. Must be one of: pending, success, failed"
}
```

---

### 6.4. Test Unauthorized Access (No Token)

**Bước 1:** Click nút **"Authorize"** trong Swagger
**Bước 2:** Click **"Logout"** để xóa token
**Bước 3:** Thử gọi bất kỳ Event API nào

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login first."
}
```

---

### 6.5. Test Expired Token

**Khi nào xảy ra:** Access token hết hạn sau 1 giờ

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token. Please login again."
}
```

**Giải pháp:** Dùng `POST /api/auth/refresh` với refresh token để lấy token mới

---

## 7. 🔧 Troubleshooting

### Vấn đề 1: "No token provided"

**Nguyên nhân:** Chưa authorize trong Swagger

**Giải pháp:**
1. Click nút **"Authorize"** (🔒) ở góc trên
2. Nhập: `Bearer {your_access_token}`
3. Click **"Authorize"** → **"Close"**

---

### Vấn đề 2: "Invalid or expired token"

**Nguyên nhân:** Token đã hết hạn (> 1 giờ)

**Giải pháp:**
1. Dùng `POST /api/auth/refresh` với refresh token
2. Lấy access token mới
3. Authorize lại trong Swagger

---

### Vấn đề 3: "Forbidden - You don't have permission"

**Nguyên nhân:** Bạn đang cố truy cập event của người khác

**Giải pháp:**
- Chỉ có thể truy cập events của chính mình
- Kiểm tra lại `id` của event

---

### Vấn đề 4: "Event not found"

**Nguyên nhân:** 
- ID không tồn tại
- Event đã bị xóa
- Nhập sai ID

**Giải pháp:**
- Kiểm tra lại ID
- Dùng `GET /api/events` để lấy danh sách events hiện có

---

### Vấn đề 5: Google OAuth Callback Error

**Nguyên nhân:** 
- Code đã được sử dụng
- Code hết hạn (> 10 phút)
- Sai redirect URI

**Giải pháp:**
1. Lấy URL mới từ `GET /api/auth/google/url`
2. Đăng nhập lại Google
3. Copy code MỚI từ callback URL
4. Gọi callback API ngay lập tức (trong vòng 10 phút)

---

## 8. 📊 Flow Test Hoàn Chỉnh - From Start to Finish

### ✅ Flow A: First Time User - Tạo và Quản lý Event

```
1. GET  /api/health
   └─> Kiểm tra server đang chạy

2. GET  /api/auth/google/url  
   └─> Lấy auth URL

3. [Browser] Đăng nhập Google
   └─> Nhận code

4. GET  /api/auth/google/callback?code=...
   └─> Lấy accessToken và refreshToken
   └─> Copy accessToken

5. [Swagger] Click "Authorize"
   └─> Paste "Bearer {accessToken}"

6. POST /api/events
   └─> Tạo event mới
   └─> Lưu lại id

7. GET  /api/events
   └─> Xem tất cả events

8. GET  /api/events/{id}
   └─> Xem chi tiết event vừa tạo

9. GET  /api/events/status?status=pending
   └─> Xem events đang pending

10. PUT  /api/events/{id}
    └─> Cập nhật syncStatus = success

11. GET  /api/events/status?status=success
    └─> Verify event đã chuyển sang success

12. DELETE /api/events/{id} (Optional)
    └─> Xóa event
```

---

### ✅ Flow B: Multiple Events Management

```
1. [Sau khi đã authorize]

2. POST /api/events (Data Mẫu 1 - Event Cơ Bản)
   └─> Tạo event 1

3. POST /api/events (Data Mẫu 2 - Event với Attributes)
   └─> Tạo event 2

4. POST /api/events (Data Mẫu 3 - Event Thực Hành)
   └─> Tạo event 3

5. GET  /api/events
   └─> Xem tất cả 3 events

6. GET  /api/events/status?status=pending
   └─> Xem các events chưa sync

7. PUT  /api/events/{id1} với syncStatus=success
   └─> Đánh dấu event 1 đã sync

8. PUT  /api/events/{id2} với syncStatus=failed
   └─> Đánh dấu event 2 sync failed

9. GET  /api/events/status?status=success
   └─> Chỉ thấy event 1

10. GET  /api/events/status?status=failed
    └─> Chỉ thấy event 2
```

---

## 9. 📋 Checklist Test Đầy Đủ

### Authentication
- [ ] GET `/api/auth/google/url` - Lấy auth URL thành công
- [ ] Đăng nhập Google trên browser thành công
- [ ] GET `/api/auth/google/callback` - Nhận được tokens
- [ ] Authorize trong Swagger UI thành công
- [ ] POST `/api/auth/refresh` - Refresh token thành công

### Health Check
- [ ] GET `/api/health` - Server healthy

### Events - Create
- [ ] POST `/api/events` - Tạo event cơ bản
- [ ] POST `/api/events` - Tạo event với attributes
- [ ] POST `/api/events` - Test idempotency (gửi lại cùng data)

### Events - Read
- [ ] GET `/api/events` - Lấy tất cả events
- [ ] GET `/api/events/{id}` - Lấy event theo ID
- [ ] GET `/api/events/{id}` - Test với ID không tồn tại (404)
- [ ] GET `/api/events/status?status=pending`
- [ ] GET `/api/events/status?status=success`
- [ ] GET `/api/events/status?status=failed`

### Events - Update
- [ ] PUT `/api/events/{id}` - Cập nhật title
- [ ] PUT `/api/events/{id}` - Cập nhật time
- [ ] PUT `/api/events/{id}` - Cập nhật sync status
- [ ] PUT `/api/events/{id}` - Cập nhật attributes

### Events - Delete
- [ ] DELETE `/api/events/{id}` - Xóa event thành công

### Error Handling
- [ ] Test without token (401)
- [ ] Test with expired token (401)
- [ ] Test với missing required fields (400)
- [ ] Test với invalid date format (400)
- [ ] Test với invalid status (400)
- [ ] Test truy cập event của người khác (403)

---

## 10. 📝 Notes Quan Trọng

### Format DateTime
✅ **Đúng:** `2026-02-05T07:00:00.000Z` (ISO 8601)  
❌ **Sai:** `2026-02-05 07:00:00`

### Required Fields (POST /api/events)
- ✅ `sheetId` (string)
- ✅ `tabName` (string)  
- ✅ `title` (string)
- ✅ `startTime` (ISO datetime)
- ✅ `endTime` (ISO datetime)
- ⭕ `rowNumber` (number) - Optional, default 0
- ⭕ `attributes` (array) - Optional

### Token Expiry
- **Access Token:** 1 giờ
- **Refresh Token:** 30 ngày
- Khi access token hết hạn → dùng refresh token

### Authorization
- Chỉ có thể truy cập/sửa/xóa events của chính mình
- API tự động kiểm tra ownership
- Vi phạm → 403 Forbidden

---

**🎉 Chúc bạn test thành công!**
