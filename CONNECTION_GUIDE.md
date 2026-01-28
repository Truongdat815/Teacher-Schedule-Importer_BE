# 🔗 Hướng Dẫn Kết Nối Frontend với Backend

Hướng dẫn nhanh để kết nối project frontend hiện có với backend này.

---

## ✅ Kiểm Tra Backend

### 1. Đảm bảo Backend đang chạy

```bash
# Trong thư mục backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### 2. Kiểm tra CORS đã được cấu hình

Backend đã có CORS cấu hình sẵn trong `src/app.ts`:
```typescript
app.use(cors()); // Cho phép tất cả origins
```

✅ **Không cần thay đổi gì ở backend!**

---

## ⚙️ Cấu Hình Frontend

### Bước 1: Thêm API Base URL vào Frontend

Tạo hoặc cập nhật file `.env.local` (hoặc `.env` tùy framework) trong project frontend:

**Cho Next.js:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

**Cho React + Vite:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Cho React CRA:**
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### Bước 2: Tạo hoặc cập nhật API Client

Trong project frontend, tạo file API client (ví dụ: `lib/api/client.ts` hoặc `src/services/api.ts`):

```typescript
import axios from 'axios';

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  process.env.REACT_APP_API_BASE_URL || 
  'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Bước 3: Cập nhật Google OAuth Redirect URI

**Trong Backend `.env` file:**

Cập nhật `GOOGLE_REDIRECT_URI` để trỏ đến frontend callback URL:

```env
# Ví dụ nếu frontend chạy tại localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/callback

# Hoặc nếu frontend chạy tại localhost:5173 (Vite)
GOOGLE_REDIRECT_URI=http://localhost:5173/callback
```

**Lưu ý:** URL này phải khớp với URL đã đăng ký trong Google Cloud Console.

---

## 🔄 Các API Endpoints Có Sẵn

### Authentication
- `GET /api/auth/google/url` - Lấy Google OAuth URL
- `GET /api/auth/google/callback?code=xxx` - Xử lý OAuth callback

### Events
- `POST /api/events` - Tạo/cập nhật event
- `GET /api/events?userId=xxx` - Lấy events của user
- `GET /api/events/:id` - Lấy event theo ID
- `PUT /api/events/:id` - Cập nhật event
- `DELETE /api/events/:id` - Xóa event
- `GET /api/events/status?status=xxx` - Lấy events theo sync status

### Health Check
- `GET /api/health` - Kiểm tra API status

---

## 📝 Ví Dụ Gọi API

### 1. Lấy Google OAuth URL

```typescript
const response = await apiClient.get('/auth/google/url');
const { url } = response.data;
window.location.href = url; // Redirect đến Google
```

### 2. Xử lý OAuth Callback

```typescript
// Trong callback page (ví dụ: /callback?code=xxx)
const code = new URLSearchParams(window.location.search).get('code');
const response = await apiClient.get('/auth/google/callback', {
  params: { code }
});
// Lưu userId: localStorage.setItem('userId', response.data.user.id);
```

### 3. Tạo Event

```typescript
const eventData = {
  userId: localStorage.getItem('userId'),
  sheetId: 'your-sheet-id',
  tabName: 'Sheet1',
  rowNumber: 1,
  title: 'Event Title',
  startTime: '2025-02-15T13:00:00Z',
  endTime: '2025-02-15T15:00:00Z',
  attributes: [
    { key: 'Giảng viên', value: 'Nguyễn Văn A', role: 'HOST' }
  ]
};

const response = await apiClient.post('/events', eventData);
```

### 4. Lấy Danh Sách Events

```typescript
const userId = localStorage.getItem('userId');
const response = await apiClient.get('/events', {
  params: { userId }
});
const events = response.data.data;
```

---

## ✅ Test Kết Nối

### 1. Test Backend đang chạy

Mở browser và truy cập:
```
http://localhost:5000/api/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

### 2. Test từ Frontend

Trong frontend, thử gọi API:

```typescript
// Test connection
try {
  const response = await apiClient.get('/health');
  console.log('✅ Backend connected!', response.data);
} catch (error) {
  console.error('❌ Connection failed:', error);
}
```

### 3. Kiểm tra CORS

Mở Browser DevTools (F12) → Network tab:
- Gọi API từ frontend
- Kiểm tra response headers có `Access-Control-Allow-Origin: *` không
- Nếu có lỗi CORS, kiểm tra backend có đang chạy không

---

## 🐛 Troubleshooting

### Lỗi: "Network Error" hoặc "CORS Error"

**Nguyên nhân:**
- Backend chưa chạy
- API_BASE_URL sai
- CORS chưa được cấu hình

**Giải pháp:**
1. Đảm bảo backend đang chạy: `npm run dev` trong thư mục backend
2. Kiểm tra `API_BASE_URL` trong `.env` của frontend
3. Kiểm tra `src/app.ts` có `app.use(cors())` không

### Lỗi: "404 Not Found"

**Nguyên nhân:**
- API endpoint sai
- Base URL sai

**Giải pháp:**
- Kiểm tra Swagger UI: `http://localhost:5000/api-docs`
- Đảm bảo endpoint đúng format: `/api/events` (có `/api` prefix)

### Lỗi: "401 Unauthorized"

**Nguyên nhân:**
- Chưa đăng nhập
- userId không đúng

**Giải pháp:**
- Đảm bảo đã gọi `/auth/google/callback` và lưu userId
- Kiểm tra userId có trong localStorage không

---

## 📚 Tài Liệu Tham Khảo

- **Swagger UI**: `http://localhost:5000/api-docs` - Xem tất cả API endpoints
- **API Test Data**: Xem file `API_TEST_DATA.md` để có data mẫu
- **Backend README**: Xem `README.md` để hiểu cấu trúc backend

---

## ✅ Checklist Kết Nối

- [ ] Backend đang chạy tại `http://localhost:5000`
- [ ] Frontend có file `.env` với `API_BASE_URL` đúng
- [ ] Frontend có API client để gọi backend
- [ ] `GOOGLE_REDIRECT_URI` trong backend `.env` trỏ đến frontend callback URL
- [ ] Test gọi `/api/health` thành công từ frontend
- [ ] Test authentication flow hoạt động

---

**Sau khi hoàn thành các bước trên, frontend và backend đã được kết nối! 🎉**
