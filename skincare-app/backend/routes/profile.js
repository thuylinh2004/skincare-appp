import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Lấy hồ sơ (profile) của người dùng
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Lỗi không phải "không tìm thấy"
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Tạo hoặc cập nhật hồ sơ người dùng
router.put('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, age, skin_type, skin_concerns, avatar_url } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (age && (age < 13 || age > 100)) {
      return res.status(400).json({ error: 'Age must be between 13 and 100' });
    }

    const validSkinTypes = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
    if (skin_type && !validSkinTypes.includes(skin_type)) {
      return res.status(400).json({ error: 'Invalid skin type' });
    }

    const profileData = {
      user_id: userId,
      name: name.trim(),
      ...(age && { age: parseInt(age) }),
      ...(skin_type && { skin_type }),
      ...(Array.isArray(skin_concerns) && { skin_concerns }),
      ...(avatar_url && { avatar_url })
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Lấy thống kê người dùng
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy số lần phân tích
    const { count: analysisCount } = await supabase
      .from('skin_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Lấy số routine
    const { count: routineCount } = await supabase
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Lấy điểm da gần nhất
    const { data: latestAnalysis } = await supabase
      .from('skin_analyses')
      .select('skin_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Xu hướng điểm da (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentAnalyses } = await supabase
      .from('skin_analyses')
      .select('skin_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Tính phần trăm cải thiện
    let improvement = 0;
    if (recentAnalyses && recentAnalyses.length >= 2) {
      const firstScore = recentAnalyses[0].skin_score;
      const lastScore = recentAnalyses[recentAnalyses.length - 1].skin_score;
      improvement = ((lastScore - firstScore) / firstScore) * 100;
    }

    res.json({
      success: true,
      data: {
        analysisCount: analysisCount || 0,
        routineCount: routineCount || 0,
        latestSkinScore: latestAnalysis?.skin_score || 0,
        improvement: Math.round(improvement * 10) / 10,
        scoreHistory: recentAnalyses || []
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;