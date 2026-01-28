# Teacher Schedule Importer - Backend API

Backend API cho ứng dụng import lịch giảng dạy từ Google Sheets vào Google Calendar.

## 📋 Yêu cầu hệ thống

### 1. Node.js và npm
- **Node.js**: phiên bản 18.x trở lên
- **npm**: đi kèm với Node.js (hoặc yarn/pnpm)

**Cách kiểm tra:**
```bash
node --version  # Phải >= 18.0.0
npm --version
```

**Cách cài đặt:**
- Windows: Tải từ [nodejs.org](https://nodejs.org/) và cài đặt
- Hoặc dùng package manager: `choco install nodejs` (với Chocolatey)

### 2. PostgreSQL Database
Project sử dụng PostgreSQL database (hiện tại dùng Neon - cloud PostgreSQL).

**Nếu muốn dùng database local:**
- Tải PostgreSQL từ [postgresql.org](https://www.postgresql.org/download/)
- Hoặc dùng Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

### 3. Git (tùy chọn)
Để clone project từ repository:
- Tải Git từ [git-scm.com](https://git-scm.com/downloads)

## 🚀 Hướng dẫn cài đặt và chạy project

### Bước 1: Clone hoặc tải project
```bash
# Nếu có Git
git clone <repository-url>
cd Teacher-Schedule-Importer_BE

# Hoặc giải nén file ZIP nếu tải về
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

Lệnh này sẽ cài đặt tất cả các thư viện cần thiết từ `package.json`:
- **Dependencies**: Express, Prisma, Google APIs, Swagger, etc.
- **DevDependencies**: TypeScript, nodemon, ts-node, etc.

### Bước 3: Cấu hình môi trường

**Copy file `.env.example` thành `.env`:**
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

File `.env.example` đã có sẵn:
- ✅ **DATABASE_URL**: Database chung cho tất cả mọi người (đã được cấu hình sẵn)
- ⚙️ **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: Cần điền thông tin Google OAuth của bạn

**Lưu ý:**
- Database đã được cấu hình sẵn, mọi người sẽ dùng chung database này
- Chỉ cần điền thông tin Google OAuth nếu muốn test tính năng authentication
- File `.env` đã được gitignore, không commit lên repository

### Bước 4: Setup Database với Prisma

#### 4.1. Generate Prisma Client
```bash
npm run prisma:generate
```

Lệnh này tạo Prisma Client từ schema để sử dụng trong code.

#### 4.2. Tạo database tables
```bash
npm run prisma:push
```

Lệnh này sẽ tạo tất cả các bảng trong database theo schema định nghĩa trong `prisma/schema.prisma`.

**Lưu ý:** Đảm bảo `DATABASE_URL` trong `.env` đã đúng trước khi chạy lệnh này.

#### 4.3. (Tùy chọn) Mở Prisma Studio
```bash
npm run prisma:studio
```

Mở giao diện web để xem và quản lý dữ liệu trong database.

### Bước 5: Chạy project

#### Development mode (với auto-reload)
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000` và tự động restart khi có thay đổi code.

#### Production mode
```bash
# Build TypeScript sang JavaScript
npm run build

# Chạy server
npm start
```

## 📚 API Documentation

Sau khi server chạy, truy cập Swagger UI tại:
```
http://localhost:5000/api-docs
```

### Các endpoints chính:

#### Health Check
- `GET /` - Kiểm tra server có hoạt động
- `GET /api/health` - Health check API

#### Authentication
- `GET /api/auth/google/url` - Lấy Google OAuth URL
- `GET /api/auth/google/callback` - Callback sau khi xác thực Google

#### Events
- `POST /api/events` - Tạo/cập nhật event (idempotent)
- `GET /api/events?userId=xxx` - Lấy tất cả events của user
- `GET /api/events/:id` - Lấy event theo ID
- `PUT /api/events/:id` - Cập nhật event
- `DELETE /api/events/:id` - Xóa event
- `GET /api/events/status?status=xxx` - Lấy events theo sync status

## 🛠️ Cấu trúc project

```
Teacher-Schedule-Importer_BE/
├── prisma/
│   └── schema.prisma          # Database schema định nghĩa
├── src/
│   ├── config/
│   │   ├── prisma.ts          # Prisma Client configuration
│   │   └── swagger.ts         # Swagger documentation config
│   ├── controllers/
│   │   ├── authController.ts  # Authentication endpoints
│   │   ├── eventController.ts # Event CRUD endpoints
│   │   └── healthController.ts
│   ├── services/
│   │   ├── authService.ts     # Authentication logic
│   │   └── eventService.ts    # Event business logic
│   ├── app.ts                 # Express app configuration
│   ├── routes.ts              # API routes
│   └── server.ts              # Server entry point
├── .env                       # Environment variables (không commit)
├── .gitignore                 # Git ignore rules
├── nodemon.json               # Nodemon configuration
├── package.json               # Dependencies và scripts
├── prisma.config.ts           # Prisma configuration (Prisma 7)
└── tsconfig.json              # TypeScript configuration
```

## 📦 Scripts có sẵn

- `npm run dev` - Chạy development server với auto-reload
- `npm run build` - Build TypeScript sang JavaScript
- `npm start` - Chạy production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Tạo/cập nhật database schema
- `npm run prisma:studio` - Mở Prisma Studio GUI

## 🔧 Troubleshooting

### Lỗi: "PrismaClient needs to be constructed with adapter"
**Giải pháp:** Đảm bảo đã cài đặt `@prisma/adapter-pg` và `pg`:
```bash
npm install @prisma/adapter-pg pg
```

### Lỗi: "The table does not exist"
**Giải pháp:** Chạy lại migration:
```bash
npm run prisma:push
```

### Lỗi: "Cannot find module '@prisma/client'"
**Giải pháp:** Generate Prisma Client:
```bash
npm run prisma:generate
```

### Lỗi: Port 5000 đã được sử dụng
**Giải pháp:** Thay đổi PORT trong file `.env`:
```env
PORT=5001
```

### Database connection failed
**Giải pháp:** 
1. Kiểm tra `DATABASE_URL` trong `.env` có đúng không
2. Kiểm tra database server có đang chạy không
3. Kiểm tra firewall/network có chặn kết nối không

## 📝 Lưu ý quan trọng

1. **File .env**: Không commit file `.env` lên Git (đã được gitignore)
2. **Database**: Đảm bảo database đã được tạo và accessible trước khi chạy `prisma:push`
3. **Prisma 7**: Project sử dụng Prisma 7, cần file `prisma.config.ts` để cấu hình database
4. **Node version**: Yêu cầu Node.js 18+ để tương thích với các dependencies

## 🔗 Tài liệu tham khảo

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Swagger/OpenAPI](https://swagger.io/specification/)

## 📄 License

[Thêm license nếu có]
