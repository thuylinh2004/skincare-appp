import React, { useEffect, useMemo, useState, useRef } from 'react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, MessageCircle, ExternalLink, Filter, Volume2, Mic, StopCircle } from 'lucide-react';

// Thêm kiểu dữ liệu cho SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionError extends Event {
  error: string;
  message?: string;
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  rating?: number;
  description?: string;
  category?: string;
  skin_types?: string[];
  official_url?: string;
}

const ProductSuggestions: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', brand: '', skinType: '', maxPrice: '' });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Xin chào! Bạn đang quan tâm đến loại sản phẩm nào? (VD: sữa rửa mặt, serum, kem chống nắng...)' }
  ]);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const speechSynthesisUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const recognition = useRef<any>(null);

  useEffect(() => {
    // Load latest analysis to auto-map skin type and trigger first external search
    const init = async () => {
      try {
        // Get latest analysis
        const history = await apiService.getAnalysisHistory().catch(() => []);
        const latest = Array.isArray(history) && history.length > 0 ? history[0] : null;
        let mappedSkin = '';
        const rawSkin: string | undefined = latest?.analysis_data?.skinType || latest?.analysis_data?.skinTypeVietnamese;
        if (rawSkin) {
          const v = (rawSkin || '').toString().toLowerCase();
          // Map Vietnamese to English keywords for search phrase
          if (['da dầu', 'dầu', 'oily'].includes(v)) mappedSkin = 'oily';
          else if (['da khô', 'khô', 'dry'].includes(v)) mappedSkin = 'dry';
          else if (['da hỗn hợp', 'hỗn hợp', 'combination'].includes(v)) mappedSkin = 'combination';
          else if (['da nhạy cảm', 'nhạy cảm', 'sensitive'].includes(v)) mappedSkin = 'sensitive';
          else if (['da bình thường', 'bình thường', 'normal'].includes(v)) mappedSkin = 'normal';
        }
        if (mappedSkin) {
          setFilters(prev => ({ ...prev, skinType: mappedSkin }));
          await fetchProductsExternal(query, mappedSkin);
        } else {
          await fetchProductsExternal(query, '');
        }
      } catch {
        await fetchProductsExternal(query, '');
      }
    };
    init();
  }, []);

  const fetchProductsExternal = async (q: string, skinType: string) => {
    try {
      setLoading(true);
      const data = await apiService.searchExternalProducts(q, skinType);
      setProducts(data || []);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchProductsExternal(query, filters.skinType);
  };

  const onFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const onApplyFilters = async () => {
    await fetchProductsExternal(query, filters.skinType);
  };

  // Hàm đọc văn bản
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
      
      // Dừng đọc nếu đang đọc
      if (isSpeaking) {
        speechSynthesis.current.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; // Đặt ngôn ngữ tiếng Việt
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesisUtterance.current = utterance;
      speechSynthesis.current.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Hàm khởi tạo nhận dạng giọng nói
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng thử trên Chrome hoặc Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN'; // Đặt ngôn ngữ tiếng Việt

    return recognition;
  };

  // Hàm bắt đầu ghi âm và nhận dạng giọng nói
  const startRecording = async () => {
    try {
      // Dừng ghi âm nếu đang ghi
      if (isRecording) {
        stopRecording();
        return;
      }

      // Khởi tạo nhận dạng giọng nói
      const speechRecognition = initSpeechRecognition();
      if (!speechRecognition) {
        setIsRecording(false);
        return;
      }

      recognition.current = speechRecognition;

      // Xử lý kết quả nhận dạng
      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev ? prev + ' ' + transcript : transcript).trim());
      };

      // Xử lý lỗi
      recognition.current.onerror = (event: SpeechRecognitionError) => {
        console.error('Lỗi nhận dạng giọng nói:', event.error);
        if (event.error === 'not-allowed') {
          alert('Bạn cần cấp quyền sử dụng microphone để sử dụng tính năng này.');
        } else if (event.error === 'language-not-supported') {
          alert('Ngôn ngữ tiếng Việt không được hỗ trợ trên trình duyệt này.');
        } else {
          alert('Có lỗi xảy ra khi nhận dạng giọng nói. Vui lòng thử lại.');
        }
        setIsRecording(false);
      };

      // Bắt đầu nhận dạng
      recognition.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Lỗi khi khởi tạo nhận dạng giọng nói:', error);
      alert('Không thể khởi tạo nhận dạng giọng nói. Vui lòng thử lại sau.');
      setIsRecording(false);
    }
  };

  // Hàm dừng ghi âm và nhận dạng giọng nói
  const stopRecording = () => {
    // Dừng MediaRecorder nếu đang ghi âm
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    
    // Dừng SpeechRecognition nếu đang nhận dạng
    if (recognition.current) {
      try {
        recognition.current.stop();
      } catch (error) {
        console.error('Lỗi khi dừng nhận dạng giọng nói:', error);
      }
      recognition.current = null;
    }
    
    setIsRecording(false);
  };

  // Hàm xử lý gửi tin nhắn
  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    try {
      setChatLoading(true);
      const res = await apiService.productChat(text);
      const reply = (res?.reply ?? res?.data?.reply ?? '');
      setMessages(prev => [...prev, { role: 'assistant', content: reply || 'Mình chưa rõ, bạn có thể nói cụ thể hơn?' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, chatbot đang bận. Vui lòng thử lại sau.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Dừng đọc văn bản
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
      
      // Dừng ghi âm
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      
      // Dừng nhận dạng giọng nói
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch (error) {
          console.error('Lỗi khi dừng nhận dạng giọng nói:', error);
        }
      }
    };
  }, []);

  const list = useMemo(() => products, [products]);

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
          <form onSubmit={onSearch} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm sản phẩm hoặc hoạt chất..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-lg">Tìm</button>
          </form>
          <div className="mt-3 grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Danh mục</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={filters.category} onChange={(e)=>onFilterChange('category', e.target.value)} placeholder="serum, cleanser..." />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Thương hiệu</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={filters.brand} onChange={(e)=>onFilterChange('brand', e.target.value)} placeholder="La Roche-Posay..." />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Loại da</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={filters.skinType} onChange={(e)=>onFilterChange('skinType', e.target.value)} placeholder="oily, dry..." />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Giá tối đa</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={filters.maxPrice} onChange={(e)=>onFilterChange('maxPrice', e.target.value)} placeholder="500000" />
            </div>
            <div className="sm:col-span-4 text-right">
              <button type="button" onClick={onApplyFilters} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm">
                <Filter className="w-4 h-4" /> Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border">Không tìm thấy sản phẩm phù hợp.</div>
          ) : (
            list.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.brand || '—'} • {p.category || '—'}</p>
                    {p.skin_types && p.skin_types.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">Phù hợp: {p.skin_types.join(', ')}</div>
                    )}
                    {/* Giá có thể không có trong external search */}
                  </div>
                  <div>
                    <a
                      href={p.official_url || `https://www.google.com/search?q=${encodeURIComponent(p.name + ' chính hãng')}`}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      target="_blank" rel="noreferrer"
                    >
                      Mua chính hãng <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                {p.description && <p className="mt-3 text-gray-700 text-sm line-clamp-3">{p.description}</p>}
                {p && (p as any).displayLink && (
                  <div className="mt-2 text-xs text-gray-500">Nguồn: {(p as any).displayLink}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chatbot */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900">Tư vấn sản phẩm & chăm sóc da</h3>
          </div>
          <div className="h-96 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className="inline-flex items-start max-w-[90%]">
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="mr-2 p-1 text-gray-500 hover:text-teal-600 self-center"
                      title="Đọc câu trả lời"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking && messages[i] === m ? 'text-teal-600' : ''}`} />
                    </button>
                  )}
                  <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                    m.role === 'user' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-white border'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                placeholder="Hỏi về sản phẩm, cách dùng, thắc mắc chăm sóc da..."
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                  isRecording 
                    ? 'text-red-500 animate-pulse' 
                    : 'text-gray-500 hover:text-teal-600'
                }`}
                title={isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button 
              onClick={handleSend} 
              disabled={chatLoading} 
              className="px-3 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              {chatLoading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestions;
