import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress - Lấy danh sách ghi chú/tiến triển của người dùng
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch progress entries' });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Progress fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch progress entries' });
  }
});

// POST /api/progress - Tạo ghi chú/tiến triển mới
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes, skin_score, analysis_id } = req.body;

    if (typeof skin_score !== 'number' || skin_score < 0 || skin_score > 10) {
      return res.status(400).json({ error: 'skin_score must be a number between 0 and 10' });
    }

    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        user_id: userId,
        notes: notes || '',
        skin_score,
        ...(analysis_id && { analysis_id })
      })
      .select('*')
      .single();

    if (error) {
      console.error('Progress create error:', error);
      return res.status(500).json({ error: 'Failed to create progress entry' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Progress create error:', err);
    return res.status(500).json({ error: 'Failed to create progress entry' });
  }
});

// PUT /api/progress/:id - Cập nhật ghi chú/tiến triển
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { notes, skin_score } = req.body;

    // Kiểm tra quyền sở hữu
    const { data: existing, error: checkErr } = await supabase
      .from('progress_entries')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkErr || !existing || existing.user_id !== userId) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    if (skin_score !== undefined) {
      const n = Number(skin_score);
      if (Number.isNaN(n) || n < 0 || n > 10) {
        return res.status(400).json({ error: 'skin_score must be a number between 0 and 10' });
      }
    }

    const updateData = {};
    if (typeof notes === 'string') updateData.notes = notes;
    if (skin_score !== undefined) updateData.skin_score = Number(skin_score);

    const { data, error } = await supabase
      .from('progress_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Progress update error:', error);
      return res.status(500).json({ error: 'Failed to update progress entry' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Progress update error:', err);
    return res.status(500).json({ error: 'Failed to update progress entry' });
  }
});

// DELETE /api/progress/:id - Xóa ghi chú/tiến triển
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('progress_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete progress entry' });
    }

    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Progress delete error:', err);
    return res.status(500).json({ error: 'Failed to delete progress entry' });
  }
});

export default router;
