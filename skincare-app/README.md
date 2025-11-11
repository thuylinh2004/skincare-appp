# Smart Skincare Analysis App

Ứng dụng phân tích da thông minh sử dụng AI Gemini và Supabase.

## Cấu trúc dự án

```
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── package.json
├── supabase/          # Database migrations
│   └── migrations/
└── package.json       # Root workspace
```

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm run install:all
```

### 2. Cấu hình môi trường

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
# Điền thông tin Supabase
```

#### Backend (.env)
```bash
cd backend
cp .env.example .env
# Điền thông tin Supabase và Gemini API key
```

### 3. Thiết lập Supabase
1. Tạo project mới trên [Supabase](https://supabase.com)
2. Chạy migrations trong thư mục `supabase/migrations/`
3. Cấu hình Storage bucket tên `skin-analysis`

### 4. Lấy Gemini API Key
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Thêm vào file `.env` của backend

## Chạy ứng dụng

### Development
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

### Production
```bash
npm run build
```

## Tính năng chính

- **Phân tích da AI**: Sử dụng Gemini AI để phân tích hình ảnh da
- **Quản lý hồ sơ**: Lưu trữ thông tin cá nhân và lịch sử phân tích
- **Routine skincare**: Tạo và quản lý routine chăm sóc da
- **Theo dõi tiến triển**: Xem sự thay đổi của da theo thời gian
- **Bảo mật**: Authentication và RLS với Supabase

## API Endpoints

- `POST /api/analysis/analyze` - Phân tích hình ảnh da
- `GET /api/analysis/history` - Lịch sử phân tích
- `GET /api/profile` - Thông tin hồ sơ
- `PUT /api/profile` - Cập nhật hồ sơ
- `GET /api/routines` - Danh sách routine
- `POST /api/routines` - Tạo routine mới

## Công nghệ sử dụng

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons
- Supabase Client

### Backend
- Node.js + Express
- Gemini AI
- Supabase
- Sharp (xử lý ảnh)
- Multer (upload file)

### Database
- PostgreSQL (Supabase)
- Row Level Security
- Real-time subscriptions