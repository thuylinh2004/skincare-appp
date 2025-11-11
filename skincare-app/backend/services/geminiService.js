import { geminiModel } from '../config/gemini.js';

// Extract JSON block from Gemini output
function extractJson(text) {
  if (!text) return null;
  const fence = /```(?:json)?\n([\s\S]*?)\n```/i.exec(text);
  if (fence) return fence[1];
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1);
  return null;
}

// Simple chat for skincare/product consultation using provided context
export async function chatSkinAssistant(context, userMessage) {
  const prompt = `Bạn là trợ lý tư vấn chăm sóc da cho người Việt. Dựa vào NGỮ CẢNH dưới đây, hãy trả lời ngắn gọn, chính xác, ưu tiên an toàn.

NGỮ CẢNH (phân tích da gần nhất, thói quen, mối quan tâm):
${context}

Nguyên tắc trả lời:
- Cụ thể, thân thiện, không phóng đại.
- Nếu người dùng hỏi về sản phẩm, nêu hoạt chất chính và cách dùng cơ bản.
- Nếu thiếu thông tin, hỏi lại để làm rõ.
`; 

  const geminiResult = await geminiModel.generateContent([
    { text: prompt },
    { text: `Câu hỏi: ${userMessage}` }
  ]);
  const text = await geminiResult.response.text();
  return text;
}

// Generate skincare routines from textual context (latest analysis + progress notes)
export async function generateRoutineFromContext(context) {
  // Đơn giản hóa prompt để tránh lỗi
  const prompt = `Bạn là chuyên gia da liễu. Tạo routine chăm sóc da dựa trên ngữ cảnh sau:

${context}

Trả về JSON theo định dạng:
{
  "morning": [
    {
      "order": 1,
      "product": "Tên sản phẩm",
      "description": "Hướng dẫn chi tiết",
      "benefits": "Lợi ích",
      "duration": "Thời gian",
      "tips": "Mẹo (nếu có)"
    }
  ],
  "evening": [
    {
      "order": 1,
      "product": "Tên sản phẩm",
      "description": "Hướng dẫn chi tiết",
      "benefits": "Lợi ích",
      "duration": "Thời gian",
      "tips": "Mẹo (nếu có)"
    }
  ]
}

Chỉ trả về JSON, không có văn bản nào khác.`;

  try {
    console.log('Đang gửi yêu cầu tạo routine...');
    
    // Kiểm tra xem geminiModel có tồn tại không
    if (!geminiModel) {
      throw new Error('Lỗi: Không thể kết nối đến mô hình AI');
    }
    
    // Gọi API Gemini
    const result = await geminiModel.generateContent([{ text: prompt }]);
    
    if (!result || !result.response) {
      console.error('Lỗi: Không nhận được phản hồi từ Gemini');
      throw new Error('Không thể kết nối đến dịch vụ AI');
    }
    
    const response = await result.response.text();
    console.log('Phản hồi từ Gemini:', response.substring(0, 300) + '...');
    
    // Trích xuất JSON từ phản hồi
    const jsonStr = extractJson(response);
    if (!jsonStr) {
      console.error('Không tìm thấy JSON trong phản hồi');
      throw new Error('Định dạng phản hồi không hợp lệ');
    }
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Lỗi khi phân tích JSON:', e);
      throw new Error('Lỗi xử lý dữ liệu từ AI');
    }
    
    // Chuẩn hóa dữ liệu trả về
    const normalizeSteps = (steps) => {
      if (!Array.isArray(steps)) return [];
      return steps.slice(0, 6).map((step, index) => ({
        order: typeof step.order === 'number' ? step.order : index + 1,
        product: step.product || `Bước ${index + 1}`,
        description: step.description || '',
        benefits: step.benefits || '',
        duration: step.duration || '1-2 phút',
        tips: step.tips || ''
      }));
    };
    
    // Trả về dữ liệu đã chuẩn hóa
    return {
      morning: normalizeSteps(parsed.morning || []),
      evening: normalizeSteps(parsed.evening || [])
    };
    
  } catch (error) {
    console.error('Lỗi trong quá trình tạo routine:', error);
    
    // Không trả dữ liệu sẵn, để AI xử lý hoàn toàn
    throw new Error('Không thể tạo routine từ AI. Vui lòng thử lại sau.');
  }
}

// Sanitize AI output to make sure UI always receives valid structure
function sanitize(result) {
  const safeNum = (n, min, max, def) => {
    const v = typeof n === 'number' ? n : def;
    return Math.min(Math.max(v, min), max);
  };
  const ensureArray = (arr, def, maxLen = 8) => {
    return Array.isArray(arr) && arr.length > 0 ? arr.slice(0, maxLen) : def;
  };
  const ensureString = (s, def) => {
    return typeof s === 'string' && s.trim() ? s : def;
  };
  // Heuristic overall score if model doesn't provide one
  const computeOverallScore = (r) => {
    const acneSev = safeNum(r?.concerns?.acne?.severity, 0, 10, 0);
    const wrinkleSev = safeNum(r?.concerns?.wrinkles?.severity, 0, 10, 0);
    const darkSev = safeNum(r?.concerns?.darkSpots?.severity, 0, 10, 0);
    const oil = safeNum(r?.concerns?.oiliness, 0, 10, 5);
    const hyd = safeNum(r?.concerns?.hydration, 0, 10, 5);
    const oilPenalty = Math.abs(oil - 5) * 0.8; // max 4.0
    const hydPenalty = Math.abs(hyd - 5) * 0.6; // max 3.0
    const severityPenalty = acneSev * 0.35 + darkSev * 0.25 + wrinkleSev * 0.2; // max 8.0
    const totalPenalty = severityPenalty + oilPenalty + hydPenalty; // theoretical max ~15, will clamp
    const raw = 10 - totalPenalty;
    const clamped = Math.min(Math.max(raw, 0), 10);
    return Math.round(clamped * 10) / 10;
  };
  return {
    skinType: result?.skinType || 'unknown',
    skinTypeVietnamese: result?.skinTypeVietnamese || 'Không xác định',
    concerns: {
      acne: result?.concerns?.acne || { level: 'unknown', severity: 0, areas: [], description: 'Chưa phân tích được' },
      wrinkles: result?.concerns?.wrinkles || { level: 'unknown', severity: 0, areas: [], description: 'Chưa phân tích được' },
      darkSpots: result?.concerns?.darkSpots || { level: 'unknown', severity: 0, areas: [], description: 'Chưa phân tích được' },
      poreSize: result?.concerns?.poreSize || { level: 'unknown', areas: [], description: 'Chưa phân tích được' },
      texture: result?.concerns?.texture || { level: 'unknown', description: 'Chưa phân tích được' },
      oiliness: safeNum(result?.concerns?.oiliness, 0, 10, 0),
      hydration: safeNum(result?.concerns?.hydration, 0, 10, 0)
    },
    overallScore: safeNum(result?.overallScore, 0, 10, 5),
    skinAge: typeof result?.skinAge === 'number' ? result.skinAge : 0,
    analysis: {
      strengths: ensureArray(result?.analysis?.strengths, []),
      concerns: ensureArray(result?.analysis?.concerns, []),
      priority: ensureString(result?.analysis?.priority, '')
    },
    recommendations: ensureArray(result?.recommendations, []),
    productSuggestions: {
      cleanser: ensureString(result?.productSuggestions?.cleanser, ''),
      serum: result?.productSuggestions?.serum || '',
      moisturizer: ensureString(result?.productSuggestions?.moisturizer, ''),
      sunscreen: ensureString(result?.productSuggestions?.sunscreen, '')
    },
    avoid: ensureArray(result?.avoid, []),
    routine: {
      morning: ensureArray(result?.routine?.morning, []),
      evening: ensureArray(result?.routine?.evening, [])
    },
    confidence: safeNum(result?.confidence, 0, 1, 0.1),
    analyzedAt: new Date().toISOString()
  };
}

export async function analyzeSkinFromImage(buffer, mimeType) {
  const prompt = `Bạn là chuyên gia da liễu AI chuyên nghiệp. PHẢI phân tích kỹ hình ảnh khuôn mặt được cung cấp và trả về DUY NHẤT JSON hợp lệ.

QUAN TRỌNG: 
- KHÔNG được trả về kết quả chung chung hoặc mặc định. PHẢI phân tích ảnh thực tế.
- Nếu không thể phân tích rõ ràng, hãy đánh giá dựa trên dấu hiệu có thể nhìn thấy và ghi rõ sự không chắc chắn.
- Tập trung vào: mụn, nếp nhăn, đốm nâu, lỗ chân lông, độ dầu, độ ẩm, kết cấu da.

HƯỚNG DẪN CHI TIẾT:
- Nhìn kỹ vào ảnh: kiểm tra từng vùng mặt (trán, má, mũi, cằm, môi).
- Phát hiện vấn đề: mụn đỏ/viêm, nếp nhăn quanh mắt/miệng, đốm nâu/tàn nhang, lỗ chân lông to, da bóng dầu, da khô ráp.
- Đánh giá mức độ: none/mild/moderate/severe dựa trên số lượng và rõ nét.
- Độ tin cậy: nếu ảnh mờ/không rõ, giảm confidence xuống thấp.

Bối cảnh Việt Nam: Khí hậu nóng ẩm, ưu tiên chống nắng, dưỡng ẩm, tránh kích ứng.

SCHEMA JSON (PHẢI TUÂN THEO CHÍNH XÁC):
{
  "skinType": "normal|oily|dry|combination|sensitive",
  "skinTypeVietnamese": "string mô tả tiếng Việt",
  "concerns": {
    "acne": {"level": "none|mild|moderate|severe", "severity": 0-10, "areas": ["string"], "description": "string chi tiết"},
    "wrinkles": {"level": "none|mild|moderate|severe", "severity": 0-10, "areas": ["string"], "description": "string chi tiết"},
    "darkSpots": {"level": "none|mild|moderate|severe", "severity": 0-10, "areas": ["string"], "description": "string chi tiết"},
    "poreSize": {"level": "small|medium|large", "areas": ["string"], "description": "string"},
    "texture": {"level": "smooth|uneven|rough|slightly_rough", "description": "string"},
    "oiliness": 0-10,
    "hydration": 0-10
  },
  "overallScore": 0-10,
  "skinAge": number,
  "analysis": {"strengths": ["string"], "concerns": ["string"], "priority": "string"},
  "recommendations": ["string"],
  "productSuggestions": {"cleanser": "string", "serum": "string", "moisturizer": "string", "sunscreen": "string"},
  "avoid": ["string"],
  "routine": {"morning": ["string"], "evening": ["string"]},
  "confidence": 0-1
}

LƯU Ý CUỐI:
- Chỉ trả JSON, không thêm text nào khác.
- Nếu không chắc chắn về vấn đề nào, đặt level="none" và mô tả lý do.
- Độ tin cậy phải phản ánh độ rõ nét của ảnh và sự tự tin trong phân tích.`;

  const base64 = buffer.toString('base64');
  const geminiResult = await geminiModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64, mimeType } }
        ]
      }
    ]
  });

  const text = await geminiResult.response.text();
  console.log('Raw Gemini response:', text); // Debug: log raw response
  const jsonStr = extractJson(text) || text;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    console.error('JSON string:', jsonStr);
    parsed = {};
  }

  const safe = sanitize(parsed);
  const wasParsed = Object.keys(parsed).length > 0;
  return { ...safe, sanitized: !wasParsed };
}
