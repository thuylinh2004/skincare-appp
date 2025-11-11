import express from 'express';
import { supabase } from '../config/supabase.js';
import multer from 'multer';
import { analyzeSkinFromImage } from '../services/geminiService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Test Supabase connection
router.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('skin_analyses').select('*').limit(1);
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Supabase error',
        details: error.message,
        hint: 'Check if the table exists and service role has proper permissions'
      });
    }
    return res.json({ 
      success: true, 
      tableExists: true,
      rowCount: data?.length || 0
    });
  } catch (err) {
    console.error('Test error:', err);
    return res.status(500).json({ 
      error: 'Test failed', 
      message: err.message 
    });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    }
    cb(null, true);
  }
});

// Toàn bộ logic phân tích được xử lý trong services/geminiService.js

// POST /api/analysis/analyze
// Endpoint phân tích ảnh (kết nối tới Gemini)
router.post('/analyze', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Nhận yêu cầu phân tích ảnh, kích thước:', req.file?.size, 'bytes');
    
    if (!req.file) {
      console.error('Không có file ảnh được tải lên');
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Xác định user trước để dùng cho cả 2 nhánh
    const userId = req.user?.id || null;

    try {
      console.log('Bắt đầu phân tích ảnh với Gemini...');
      const result = await analyzeSkinFromImage(req.file.buffer, req.file.mimetype);
      console.log('Phân tích ảnh thành công, kết quả:', JSON.stringify(result, null, 2));

      

      const { data: insertData, error: insertError } = await supabase
        .from('skin_analyses')
        .insert({
          user_id: userId,
          image_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          analysis_data: result,
          skin_score: result.overallScore || 0
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Lỗi khi lưu vào Supabase:', insertError);
        // Soft-fail: vẫn trả kết quả phân tích để UI hiển thị
        return res.json({ 
          success: true,
          ...result,
          analysis: result,
          analysisId: null,
          warning: `Lưu lịch sử thất bại: ${insertError.message}`
        });
      }

      console.log('Đã lưu kết quả phân tích thành công, ID:', insertData?.id);
      // Tạo ghi chú tiến triển liên kết với phân tích (nếu có user đăng nhập)
      try {
        if (userId && insertData?.id) {
          await supabase
            .from('progress_entries')
            .insert({
              user_id: userId,
              analysis_id: insertData.id,
              skin_score: result.overallScore,
              notes: `Tự động tạo sau phân tích: ${result.skinTypeVietnamese || result.skinType || 'Phân tích da'}`
            });
        }
      } catch (e) {
        console.warn('Không thể tạo progress_entries tự động:', e);
      }

      return res.json({ success: true, ...result, analysis: result, analysisId: insertData?.id || null });
      
    } catch (analysisError) {
      console.error('Lỗi trong quá trình phân tích:', analysisError);
      // Fallback đơn giản: trả về lỗi nhưng không có dữ liệu cứng
      return res.status(500).json({
        success: false,
        error: 'Không thể phân tích ảnh',
        message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
        details: analysisError.message
      });
    }
  } catch (error) {
    console.error('Lỗi không xác định:', error);
    // Trả về 200 với payload có cấu trúc để UI không trắng trang
    return res.status(200).json({ 
      success: false,
      error: 'Lỗi máy chủ nội bộ',
      details: error.message 
    });
  }
});

// GET /api/analysis/history — Lịch sử phân tích
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id; // optionalAuth có thể gắn user

    let query = supabase
      .from('skin_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: 'Lấy lịch sử phân tích thất bại' });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Lỗi lịch sử:', err);
    return res.status(500).json({ error: 'Lấy lịch sử phân tích thất bại' });
  }
});

// GET /api/analysis/:id — Chi tiết một lần phân tích
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Không tìm thấy phân tích' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Lỗi lấy chi tiết phân tích:', err);
    return res.status(500).json({ error: 'Lấy chi tiết phân tích thất bại' });
  }
});

export default router;