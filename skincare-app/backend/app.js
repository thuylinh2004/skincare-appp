import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Nhập các tuyến (routes) API
import analysisRoutes from './routes/analysis.js';
import productsRoutes from './routes/products.js';
import profileRoutes from './routes/profile.js';
import routinesRoutes from './routes/routines.js';
import progressRoutes from './routes/progress.js';
import { geminiModel } from './config/gemini.js';
import { supabase } from './config/supabase.js';

// Ensure we always load the .env located in the backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware bảo mật
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Cấu hình CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Giới hạn tốc độ (Rate limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // giới hạn mỗi IP 100 requests trong mỗi cửa sổ thời gian
  message: {
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
  }
});

app.use(limiter);

// Giới hạn tốc độ nghiêm ngặt hơn cho phân tích hình ảnh
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // giới hạn mỗi IP 20 lần phân tích mỗi giờ
  message: {
    error: 'Quá nhiều yêu cầu phân tích, vui lòng thử lại sau.'
  }
});

// Middleware chung
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint kiểm tra tình trạng (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Gắn các tuyến API
app.use('/api/analysis', analysisLimiter, analysisRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/progress', progressRoutes);

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Tệp quá lớn',
      message: 'Vui lòng tải ảnh nhỏ hơn 10MB'
    });
  }

  if (err.message === 'Invalid file type. Only JPEG, JPG, and PNG are allowed.') {
    return res.status(400).json({
      error: 'Định dạng tệp không hợp lệ',
      message: 'Chỉ cho phép ảnh JPEG, JPG và PNG'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Lỗi máy chủ nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Không tìm thấy',
    message: 'Không tìm thấy tài nguyên yêu cầu'
  });
});

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  // Startup diagnostics for env loading
  const envPath = path.join(__dirname, '.env');
  console.log(`🗂️  .env loaded from: ${envPath}`);
  console.log(`🔑 GOOGLE_CSE_KEY set: ${Boolean(process.env.GOOGLE_CSE_KEY)}`);
  console.log(`🔍 GOOGLE_CSE_CX set: ${Boolean(process.env.GOOGLE_CSE_CX)}`);
});

export default app;