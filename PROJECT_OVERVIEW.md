# 📚 Tổng Quan Project - Teacher Schedule Importer

## 🎯 Mục Đích Project

**Teacher Schedule Importer** là một Backend API giúp tự động hóa việc import lịch giảng dạy từ **Google Sheets** vào **Google Calendar**.

### Vấn Đề Giải Quyết:
- Giảng viên thường có lịch giảng dạy trong Google Sheets (từ phòng đào tạo)
- Cần đồng bộ lịch này vào Google Calendar để quản lý thời gian
- Thủ công copy-paste mất thời gian và dễ sai sót
- Cần tự động hóa quá trình này

### Giải Pháp:
- API tự động đọc dữ liệu từ Google Sheets
- Chuyển đổi thành events trong Google Calendar
- Đồng bộ 2 chiều (có thể update khi Sheets thay đổi)
- Quản lý lịch tập trung trong database

## 🏗️ Kiến Trúc Project

### Tech Stack:
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma 7
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Calendar API, Google Sheets API
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod
- **Error Handling**: Custom error classes + Global error handler

### Cấu Trúc:
```
Backend API (Node.js/Express)
    ↓
PostgreSQL Database
    ↓
Google APIs (Calendar + Sheets)
```

---

## 👥 Các Role Trong Hệ Thống

### Hiện Tại: **Single User Role** (Chưa có phân quyền)

**Tất cả users đều có quyền như nhau:**
- ✅ Quản lý events của chính mình
- ✅ Xem events của chính mình
- ✅ Đồng bộ với Google Calendar của mình

**Lưu ý:** 
- Mỗi user chỉ thấy và quản lý events của chính mình
- Không có admin role hay phân quyền đặc biệt
- Có thể mở rộng thêm roles trong tương lai (Admin, Teacher, Student, etc.)

---

## 🔄 Quy Trình Sử Dụng

### Flow 1: Đăng Nhập và Xác Thực

```
1. User truy cập Frontend
   ↓
2. Click "Đăng nhập với Google"
   ↓
3. Frontend gọi: GET /api/auth/google/url
   ↓
4. Backend trả về Google OAuth URL
   ↓
5. User redirect đến Google để đăng nhập
   ↓
6. Google redirect về: GET /api/auth/google/callback?code=xxx
   ↓
7. Backend lưu Google credentials (accessToken, refreshToken)
   ↓
8. Tạo/Update User trong database
   ↓
9. Trả về thông tin user (có thể kèm JWT token)
```

### Flow 2: Import Lịch Từ Google Sheets

```
1. User chọn Google Sheet cần import
   ↓
2. Frontend đọc dữ liệu từ Google Sheets (dùng accessToken)
   ↓
3. Parse dữ liệu thành events (mỗi row = 1 event)
   ↓
4. Gửi từng event đến: POST /api/events
   ↓
5. Backend xử lý:
   - Validate dữ liệu (Zod validation)
   - Tạo hash để check trùng lặp (idempotent)
   - Lưu vào database
   - Nếu event đã tồn tại → Update thay vì tạo mới
   ↓
6. Response về event đã được tạo/updated
```

### Flow 3: Đồng Bộ Lên Google Calendar

```
1. Backend job lấy events có syncStatus = "pending"
   ↓
2. Với mỗi event:
   - Tạo event trên Google Calendar (dùng accessToken)
   - Lưu googleEventId vào database
   - Update syncStatus = "success"
   ↓
3. Nếu có lỗi → syncStatus = "failed"
   ↓
4. User có thể retry sync sau
```

### Flow 4: Quản Lý Events

```
1. User xem danh sách events:
   GET /api/events?userId=xxx
   ↓
2. User xem chi tiết event:
   GET /api/events/:id
   ↓
3. User cập nhật event:
   PUT /api/events/:id
   ↓
4. User xóa event:
   DELETE /api/events/:id
   ↓
5. User xem events theo trạng thái sync:
   GET /api/events/status?status=pending
```

## 📊 Database Schema

### 1. User (Người Dùng)
- **Mục đích**: Lưu thông tin người dùng
- **Fields**:
  - `id` - UUID
  - `email` - Email (unique)
  - `name` - Tên
  - `avatarUrl` - Avatar URL
  - `createdAt` - Thời gian tạo

### 2. GoogleCredential (Thông Tin Xác Thực Google)
- **Mục đích**: Lưu Google OAuth tokens để gọi API
- **Fields**:
  - `id` - UUID
  - `userId` - FK đến User
  - `googleId` - Google user ID
  - `accessToken` - Token ngắn hạn
  - `refreshToken` - Token dài hạn (quan trọng!)
  - `scope` - Quyền đã cấp
  - `expiresAt` - Thời gian hết hạn

### 3. EventMapping (Sự Kiện)
- **Mục đích**: Lưu thông tin events từ Google Sheets
- **Fields**:
  - `id` - UUID
  - `userId` - FK đến User
  - `sheetId` - ID của Google Sheet
  - `tabName` - Tên tab trong Sheet
  - `rowNumber` - Số dòng trong Sheet
  - `sheetRowHash` - Hash để check trùng lặp (unique)
  - `title` - Tiêu đề event
  - `startTime` - Thời gian bắt đầu
  - `endTime` - Thời gian kết thúc
  - `googleEventId` - ID event trên Google Calendar
  - `syncStatus` - Trạng thái sync (pending/success/failed)
  - `lastSyncedAt` - Thời gian sync cuối

### 4. EventAttribute (Thuộc Tính Event)
- **Mục đích**: Lưu thông tin bổ sung (Giảng viên, Phòng, etc.)
- **Fields**:
  - `id` - UUID
  - `eventMappingId` - FK đến EventMapping
  - `key` - Tên thuộc tính (VD: "Giảng viên")
  - `value` - Giá trị (VD: "Nguyễn Văn A")
  - `role` - Vai trò (HOST, ATTENDEE, null)

## 🎭 Các Role và Chức Năng

### Role: **Teacher/Giảng Viên** (Hiện tại là role duy nhất)

#### Chức Năng 1: Xác Thực Google
- **Endpoint**: `GET /api/auth/google/url`
- **Mô tả**: Lấy URL để đăng nhập Google
- **Kết quả**: Redirect đến Google OAuth

- **Endpoint**: `GET /api/auth/google/callback`
- **Mô tả**: Xử lý callback sau khi đăng nhập Google
- **Kết quả**: Lưu Google credentials, tạo/update user

#### Chức Năng 2: Tạo/Import Events
- **Endpoint**: `POST /api/events`
- **Mô tả**: Tạo event mới hoặc cập nhật nếu đã tồn tại (idempotent)
- **Input**: 
  - Thông tin event (title, startTime, endTime)
  - Metadata từ Google Sheet (sheetId, tabName, rowNumber)
  - Attributes (Giảng viên, Phòng, etc.)
- **Kết quả**: Event được lưu vào database với syncStatus = "pending"

#### Chức Năng 3: Xem Danh Sách Events
- **Endpoint**: `GET /api/events?userId=xxx`
- **Mô tả**: Lấy tất cả events của user
- **Kết quả**: Danh sách events với đầy đủ thông tin

#### Chức Năng 4: Xem Chi Tiết Event
- **Endpoint**: `GET /api/events/:id`
- **Mô tả**: Lấy thông tin chi tiết của một event
- **Kết quả**: Event với tất cả attributes

#### Chức Năng 5: Cập Nhật Event
- **Endpoint**: `PUT /api/events/:id`
- **Mô tả**: Cập nhật thông tin event
- **Input**: 
  - Title, startTime, endTime
  - syncStatus, googleEventId
  - Attributes
- **Kết quả**: Event được cập nhật

#### Chức Năng 6: Xóa Event
- **Endpoint**: `DELETE /api/events/:id`
- **Mô tả**: Xóa event khỏi database
- **Kết quả**: Event và attributes liên quan bị xóa (cascade)

#### Chức Năng 7: Xem Events Theo Trạng Thái
- **Endpoint**: `GET /api/events/status?status=xxx`
- **Mô tả**: Lọc events theo sync status
- **Status values**: `pending`, `success`, `failed`
- **Use case**: 
  - Xem events chưa sync: `status=pending`
  - Xem events đã sync thành công: `status=success`
  - Xem events sync lỗi: `status=failed`

---

## 🔐 Bảo Mật và Phân Quyền

### Hiện Tại:
- ✅ **Authentication**: Google OAuth 2.0
- ✅ **User Isolation**: Mỗi user chỉ thấy events của mình
- ✅ **Validation**: Zod validation cho tất cả inputs
- ⚠️ **Authorization**: Chưa có role-based access control

### Cách Hoạt Động:
1. User phải đăng nhập Google để lấy credentials
2. Mỗi request cần có `userId` (từ token hoặc body)
3. Backend kiểm tra `userId` trước khi thao tác
4. Events được filter theo `userId` khi query

### Hạn Chế Hiện Tại:
- Chưa có JWT token riêng (dùng Google tokens)
- Chưa có middleware kiểm tra authentication
- Chưa có phân quyền admin/user
- User có thể truy cập events của user khác nếu biết userId (cần fix)

---

## 📈 Use Cases

### Use Case 1: Giảng Viên Import Lịch Học Kỳ Mới

```
1. Phòng đào tạo tạo Google Sheet với lịch học
2. Giảng viên mở Frontend app
3. Đăng nhập với Google account
4. Chọn Google Sheet cần import
5. Frontend đọc Sheet và gửi từng row đến API
6. API tự động tạo events trong database
7. Backend job sync events lên Google Calendar
8. Giảng viên thấy lịch trong Calendar
```

### Use Case 2: Cập Nhật Lịch Khi Có Thay Đổi

```
1. Phòng đào tạo sửa lịch trong Google Sheet
2. Giảng viên chạy lại import
3. API check hash → phát hiện thay đổi
4. Tự động update event thay vì tạo mới (idempotent)
5. Update event trên Google Calendar (nếu đã sync)
```

### Use Case 3: Xem Lịch và Quản Lý

```
1. Giảng viên mở app
2. Xem danh sách tất cả events: GET /api/events?userId=xxx
3. Xem chi tiết event: GET /api/events/:id
4. Sửa thông tin event: PUT /api/events/:id
5. Xóa event không cần thiết: DELETE /api/events/:id
```

### Use Case 4: Kiểm Tra Trạng Thái Sync

```
1. Giảng viên muốn biết events nào chưa sync
2. Gọi: GET /api/events/status?status=pending
3. Xem danh sách events chưa sync
4. Retry sync cho events failed: GET /api/events/status?status=failed
```

---

## 🎯 Tính Năng Đặc Biệt

### 1. Idempotency (Chống Trùng Lặp)
- **Cơ chế**: Dùng `sheetRowHash` (MD5 hash của sheetId + tabName + rowNumber + content)
- **Lợi ích**: 
  - Import nhiều lần không tạo duplicate
  - Tự động update khi data thay đổi
  - An toàn khi retry

### 2. Dynamic Attributes
- **Cơ chế**: Lưu attributes trong bảng riêng (key-value)
- **Lợi ích**:
  - Linh hoạt với bất kỳ cột nào trong Sheet
  - Không cần sửa schema khi thêm cột mới
  - Dễ mở rộng

### 3. Sync Status Tracking
- **Cơ chế**: Lưu trạng thái sync (pending/success/failed)
- **Lợi ích**:
  - Biết events nào đã sync
  - Có thể retry sync failed events
  - Track lịch sử sync

### 4. Google Calendar Integration
- **Cơ chế**: Lưu `googleEventId` để update sau
- **Lợi ích**:
  - Có thể update event trên Calendar
  - Đồng bộ 2 chiều
  - Không tạo duplicate khi sync lại

### 5. Validation & Error Handling
- **Zod Validation**: Validate tất cả inputs tự động
- **Custom Errors**: Error messages rõ ràng, chi tiết
- **Global Error Handler**: Xử lý errors tập trung

---

## 🔮 Mở Rộng Trong Tương Lai

### Có Thể Thêm:

1. **Role-Based Access Control (RBAC)**
   - Admin: Quản lý tất cả users và events
   - Teacher: Quản lý events của mình
   - Student: Chỉ xem lịch học
   - Department: Quản lý lịch của khoa

2. **Scheduled Sync Jobs**
   - Tự động sync định kỳ (cron job)
   - Real-time sync khi Sheet thay đổi (webhook)

3. **Notification System**
   - Thông báo khi có thay đổi lịch
   - Email/SMS notifications

4. **Analytics & Reporting**
   - Thống kê số giờ dạy
   - Báo cáo lịch giảng dạy
   - Export lịch ra PDF/Excel

5. **Multi-Calendar Support**
   - Một user có thể sync vào nhiều calendars
   - Calendar cho từng môn học

---

## 📝 Tóm Tắt

### Project Gồm:
1. ✅ **Backend API** (Node.js/Express/TypeScript)
2. ✅ **Database** (PostgreSQL với Prisma)
3. ✅ **Authentication** (Google OAuth 2.0)
4. ✅ **Event Management** (CRUD operations)
5. ✅ **Validation & Error Handling** (Zod + Custom errors)
6. ✅ **API Documentation** (Swagger UI)

### Quy Trình Sử Dụng:
1. User đăng nhập Google
2. Import lịch từ Google Sheets
3. Events được lưu vào database
4. Sync events lên Google Calendar
5. Quản lý và cập nhật events

### Roles:
- **Hiện tại**: Chỉ có 1 role (Teacher/User)
- **Tương lai**: Có thể thêm Admin, Student, Department roles

### Chức Năng Mỗi Role:
- **Teacher**: Tất cả chức năng (tạo, xem, sửa, xóa events của mình)

---

## 📚 Tài Liệu Liên Quan

- [README.md](README.md) - Hướng dẫn setup và cài đặt
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Hướng dẫn setup nhanh
- [API_TEST_DATA.md](API_TEST_DATA.md) - Data mẫu để test API
- [VALIDATION_AND_ERROR_HANDLING.md](VALIDATION_AND_ERROR_HANDLING.md) - Tài liệu validation và error handling

---

**Project hiện tại là Backend API, cần Frontend để hoàn thiện ứng dụng! 🚀**

