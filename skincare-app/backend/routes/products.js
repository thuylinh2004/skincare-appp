import express from 'express';
import { supabase } from '../config/supabase.js';
import { optionalAuth } from '../middleware/auth.js';
import { chatSkinAssistant } from '../services/geminiService.js';

const router = express.Router();

// Lấy tất cả sản phẩm kèm bộ lọc
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      skinType, 
      brand, 
      minPrice, 
      maxPrice, 
      search,
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('products')
      .select('*');

    // Áp dụng các bộ lọc
    if (category) {
      query = query.eq('category', category);
    }

    if (skinType) {
      query = query.contains('skin_types', [skinType]);
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Sắp xếp
    const validSortColumns = ['name', 'price', 'rating', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortColumn, order);

    // Phân trang
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: products, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Lấy tổng số bản ghi để tính phân trang
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + products.length < (count || 0)
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// External search via Google Custom Search to find official product links
router.get('/external-search', optionalAuth, async (req, res) => {
  try {
    const { q = '', skinType = '' } = req.query;
    // If no keyword provided, return empty list gracefully
    if (!q || String(q).trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Support both GOOGLE_CSE_KEY and legacy GOOGLE_CSE_API_KEY
    const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY || process.env.GOOGLE_CSE_API_KEY;
    const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;

    if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_CX) {
      return res.status(500).json({
        error: 'Missing GOOGLE_CSE_KEY or GOOGLE_CSE_CX env',
        message: 'Thiếu cấu hình Google Programmable Search Engine. Vui lòng thiết lập GOOGLE_CSE_KEY và GOOGLE_CSE_CX trong backend/.env rồi khởi động lại server.'
      });
    }

    const buildUrl = (query) => `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(GOOGLE_CSE_KEY)}&cx=${encodeURIComponent(GOOGLE_CSE_CX)}&q=${encodeURIComponent(query)}`;

    const query1 = [q, skinType ? `cho da ${skinType}` : '', 'chính hãng'].filter(Boolean).join(' ');
    const resp1 = await fetch(buildUrl(query1));
    if (!resp1.ok) {
      const text = await resp1.text();
      console.error('External search upstream error:', resp1.status, text);
      return res.status(502).json({
        error: 'External search failed',
        message: 'Không truy vấn được Google CSE',
        details: text
      });
    }
    let data = await resp1.json();
    let items = Array.isArray(data.items) ? data.items : [];

    // Fallback #1: remove 'chính hãng'
    if (items.length === 0) {
      const query2 = [q, skinType ? `cho da ${skinType}` : ''].filter(Boolean).join(' ');
      const resp2 = await fetch(buildUrl(query2));
      if (resp2.ok) {
        data = await resp2.json();
        items = Array.isArray(data.items) ? data.items : [];
      }
    }

    // Fallback #2: just raw keyword
    if (items.length === 0) {
      const resp3 = await fetch(buildUrl(q));
      if (resp3.ok) {
        data = await resp3.json();
        items = Array.isArray(data.items) ? data.items : [];
      }
    }
    const mapped = items.map((it) => ({
      id: it.cacheId || it.link,
      name: it.title,
      description: it.snippet,
      brand: undefined,
      price: undefined,
      rating: undefined,
      category: undefined,
      skin_types: [],
      official_url: it.link,
      displayLink: it.displayLink
    }));

    return res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('External product search error:', error);
    return res.status(500).json({
      error: 'External search error',
      message: error?.message || 'Có lỗi khi gọi tìm kiếm bên ngoài',
      ...(process.env.NODE_ENV === 'development' ? { stack: error?.stack } : {})
    });
  }
});

// Chatbot tư vấn sản phẩm/chăm sóc da
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    let latestAnalysis = null;
    if (userId) {
      const { data: analyses } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      latestAnalysis = analyses?.[0] || null;
    }

    const context = JSON.stringify({ latestAnalysis }, null, 2);
    const reply = await chatSkinAssistant(context, message);
    return res.json({ success: true, data: { reply } });
  } catch (error) {
    console.error('Products chat error:', error);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

// Lấy thông tin chi tiết một sản phẩm
router.get('/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Lấy danh mục sản phẩm
router.get('/meta/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('products')
      .select('category')
      .order('category');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    const uniqueCategories = [...new Set(categories.map(c => c.category))];

    res.json({
      success: true,
      data: uniqueCategories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Lấy nhãn hiệu (brand) sản phẩm
router.get('/meta/brands', async (req, res) => {
  try {
    const { data: brands, error } = await supabase
      .from('products')
      .select('brand')
      .order('brand');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch brands' });
    }

    const uniqueBrands = [...new Set(brands.map(b => b.brand))];

    res.json({
      success: true,
      data: uniqueBrands
    });

  } catch (error) {
    console.error('Brands fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

export default router;