# 🚀 Hướng dẫn Setup Nhanh - Máy Mới

Hướng dẫn từng bước để setup project trên máy mới (chưa có gì cài đặt).

## ⚡ Quick Start (5 phút)

### Bước 1: Cài đặt Node.js
1. Truy cập: https://nodejs.org/
2. Tải phiên bản **LTS** (Long Term Support) - khuyến nghị 18.x hoặc 20.x
3. Cài đặt với các tùy chọn mặc định
4. Mở **Command Prompt** hoặc **PowerShell** mới và kiểm tra:
   ```bash
   node --version   # Phải >= 18.0.0
   npm --version
   ```

### Bước 2: Clone/Tải project
```bash
# Nếu có Git
git clone <repository-url>
cd Teacher-Schedule-Importer_BE

# Hoặc giải nén file ZIP vào thư mục bất kỳ
```

### Bước 3: Cài đặt dependencies
Mở terminal trong thư mục project và chạy:
```bash
npm install
```

**Lưu ý:** Lần đầu có thể mất 2-5 phút để tải tất cả packages.

### Bước 4: Tạo file .env
**Copy file `.env.example` thành `.env`:**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)  
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**Lưu ý:**
- ✅ Database đã được cấu hình sẵn trong `.env.example` - mọi người dùng chung
- ⚙️ Chỉ cần điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` nếu muốn test Google OAuth
- Lấy Google credentials từ [Google Cloud Console](https://console.cloud.google.com/)

### Bước 5: Setup Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Tạo tables trong database
npm run prisma:push
```

### Bước 6: Chạy project
```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:5000**

Truy cập Swagger UI: **http://localhost:5000/api-docs**

## ✅ Checklist Setup

- [ ] Node.js 18+ đã cài đặt
- [ ] Project đã được clone/tải về
- [ ] Đã chạy `npm install` thành công
- [ ] Đã copy `.env.example` thành `.env`
- [ ] Đã chạy `npm run prisma:generate`
- [ ] Đã chạy `npm run prisma:push` (database tables đã được tạo)
- [ ] Server chạy thành công với `npm run dev`
- [ ] Có thể truy cập http://localhost:5000/api-docs

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "npm: command not found"
**Giải pháp:** Node.js chưa được cài đặt hoặc chưa thêm vào PATH. Cài lại Node.js và restart terminal.

### Lỗi: "Cannot find module '@prisma/client'"
**Giải pháp:** Chạy `npm run prisma:generate`

### Lỗi: "The table does not exist"
**Giải pháp:** Chạy `npm run prisma:push` để tạo tables

### Lỗi: "Port 5000 is already in use"
**Giải pháp:** 
1. Tìm process đang dùng port 5000: `netstat -ano | findstr :5000`
2. Hoặc đổi PORT trong `.env` thành số khác (ví dụ: 5001)

### Lỗi: "DATABASE_URL is not set"
**Giải pháp:** 
1. Kiểm tra file `.env` có tồn tại không
2. Nếu chưa có, copy từ `.env.example`: `copy .env.example .env`
3. Code đã có fallback, nhưng tốt nhất nên có file `.env`

## 📞 Cần hỗ trợ?

Nếu gặp vấn đề, kiểm tra:
1. Node.js version: `node --version` (phải >= 18)
2. Dependencies đã cài: `npm list --depth=0`
3. File `.env` có đúng format không (copy từ `.env.example`)
4. Database connection string có đúng không (đã có sẵn trong `.env.example`)

Xem thêm chi tiết trong [README.md](README.md)
