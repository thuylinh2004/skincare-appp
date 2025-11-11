import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';
import { generateRoutineFromContext } from '../services/geminiService.js';

const router = express.Router();

// Get user routines
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { active } = req.query;

    let query = supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (active === 'true') {
      query = query.eq('active', true);
    } else if (active === 'false') {
      query = query.eq('active', false);
    }

    const { data: routines, error } = await query;

    if (error) {
      console.error('Error fetching routines:', error);
      return res.status(500).json({ error: 'Failed to fetch routines' });
    }

    res.json(routines || []);
  } catch (error) {
    console.error('Error in GET /routines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI-generate routines based on latest analysis + recent progress notes
router.post('/ai-generate', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch latest analysis for this user
    const { data: analyses, error: analysisErr } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (analysisErr) {
      return res.status(500).json({ error: 'Failed to fetch latest analysis' });
    }

    const latestAnalysis = analyses?.[0] || null;

    // Fetch last 10 progress notes
    const { data: progresses, error: progressErr } = await supabase
      .from('progress_entries')
      .select('id, notes, skin_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (progressErr) {
      return res.status(500).json({ error: 'Failed to fetch progress entries' });
    }

    const context = JSON.stringify({
      latestAnalysis,
      progressEntries: progresses || []
    }, null, 2);

    const ai = await generateRoutineFromContext(context);

    // Prepare steps for DB
    const mapSteps = (steps) => (Array.isArray(steps) ? steps : []).map((step, idx) => {
      // Tạo mô tả chi tiết từ các trường có sẵn
      let description = step.description || '';
      
      // Nếu không có description, tạo mô tả từ các trường khác
      if (!description) {
        const parts = [];
        if (step.product) parts.push(`Sản phẩm: ${step.product}`);
        if (step.benefits) parts.push(`Lợi ích: ${step.benefits}`);
        if (step.tips) parts.push(`Mẹo: ${step.tips}`);
        if (step.duration) parts.push(`Thời gian: ${step.duration}`);
        
        description = parts.length > 0 ? parts.join('\n') : 'Bước chăm sóc da';
      }
      
      return {
        id: step.id || `step-${idx + 1}`,
        product_name: step.product || step.product_name || `Bước ${idx + 1}`,
        product_id: step.product_id || null,
        order: typeof step.order === 'number' ? step.order : idx + 1,
        instructions: description,
        // Giữ nguyên tất cả các trường khác
        ...step
      };
    });

    const morningSteps = mapSteps(ai.morning);
    const eveningSteps = mapSteps(ai.evening);

    const payload = [];
    if (morningSteps.length) {
      payload.push({
        user_id: userId,
        name: 'Routine buổi sáng (AI)',
        time_of_day: 'morning',
        steps: morningSteps,
        active: true
      });
    }
    if (eveningSteps.length) {
      payload.push({
        user_id: userId,
        name: 'Routine buổi tối (AI)',
        time_of_day: 'evening',
        steps: eveningSteps,
        active: true
      });
    }

    if (!payload.length) {
      return res.status(400).json({ error: 'AI không đủ thông tin để tạo routine' });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('routines')
      .insert(payload)
      .select('*');

    if (insertErr) {
      return res.status(500).json({ error: 'Failed to save AI routines' });
    }

    return res.json({ success: true, data: inserted });
  } catch (error) {
    console.error('AI generate routine error:', error);
    return res.status(500).json({ 
      error: 'AI routine generation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create routine
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, time_of_day, steps, active = true } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Routine name is required' });
    }

    const validTimeOfDay = ['morning', 'evening', 'weekly'];
    if (!validTimeOfDay.includes(time_of_day)) {
      return res.status(400).json({ error: 'Invalid time of day' });
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Routine steps are required' });
    }

    // Validate steps structure
    const validatedSteps = steps.map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      product_name: step.product_name || step.productName,
      product_id: step.product_id || step.productId,
      order: step.order || index + 1,
      instructions: step.instructions || ''
    }));

    const { data: routine, error } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: name.trim(),
        time_of_day,
        steps: validatedSteps,
        active
      })
      .select()
      .single();

    if (error) {
      console.error('Routine creation error:', error);
      return res.status(500).json({ error: 'Failed to create routine' });
    }

    res.json({
      success: true,
      data: routine
    });

  } catch (error) {
    console.error('Routine creation error:', error);
    res.status(500).json({ error: 'Failed to create routine' });
  }
});

// Update routine
router.put('/:routineId', authenticateUser, async (req, res) => {
  try {
    const { routineId } = req.params;
    const userId = req.user.id;
    const { name, time_of_day, steps, active } = req.body;

    // Check ownership
    const { data: existingRoutine, error: checkError } = await supabase
      .from('routines')
      .select('id')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingRoutine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    // Prepare update data
    const updateData = {};
    
    if (name) {
      updateData.name = name.trim();
    }

    if (time_of_day) {
      const validTimeOfDay = ['morning', 'evening', 'weekly'];
      if (!validTimeOfDay.includes(time_of_day)) {
        return res.status(400).json({ error: 'Invalid time of day' });
      }
      updateData.time_of_day = time_of_day;
    }

    if (Array.isArray(steps)) {
      const validatedSteps = steps.map((step, index) => ({
        id: step.id || `step-${index + 1}`,
        product_name: step.product_name || step.productName,
        product_id: step.product_id || step.productId,
        order: step.order || index + 1,
        instructions: step.instructions || ''
      }));
      updateData.steps = validatedSteps;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    const { data: routine, error } = await supabase
      .from('routines')
      .update(updateData)
      .eq('id', routineId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Routine update error:', error);
      return res.status(500).json({ error: 'Failed to update routine' });
    }

    res.json({
      success: true,
      data: routine
    });

  } catch (error) {
    console.error('Routine update error:', error);
    res.status(500).json({ error: 'Failed to update routine' });
  }
});

// Delete routine
router.delete('/:routineId', authenticateUser, async (req, res) => {
  try {
    const { routineId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete routine' });
    }

    res.json({
      success: true,
      message: 'Routine deleted successfully'
    });

  } catch (error) {
    console.error('Routine deletion error:', error);
    res.status(500).json({ error: 'Failed to delete routine' });
  }
});

// Get routine by ID
router.get('/:routineId', authenticateUser, async (req, res) => {
  try {
    const { routineId } = req.params;
    const userId = req.user.id;

    const { data: routine, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (error || !routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    res.json({
      success: true,
      data: routine
    });

  } catch (error) {
    console.error('Routine fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch routine' });
  }
});

export default router;