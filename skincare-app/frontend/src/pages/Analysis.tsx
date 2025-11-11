import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, TrendingUp, CheckCircle, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiService } from '../services/api';

interface AnalysisResult {
  skinType: string;
  skinTypeVietnamese: string;
  concerns: {
    acne: { level: string; severity: number; areas: string[]; description: string };
    wrinkles: { level: string; severity: number; areas: string[]; description: string };
    darkSpots: { level: string; severity: number; areas: string[]; description: string };
    poreSize: { level: string; areas: string[]; description: string };
    texture: { level: string; description: string };
    oiliness: number;
    hydration: number;
  };
  overallScore: number;
  skinAge: number;
  analysis: {
    strengths: string[];
    concerns: string[];
    priority: string;
  };
  recommendations: string[];
  productSuggestions: {
    cleanser: string;
    serum?: string;
    moisturizer: string;
    sunscreen: string;
  };
  avoid: string[];
  routine: {
    morning: string[];
    evening: string[];
  };
  confidence: number;
}

const Analysis = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addToast } = useToast();

  // Hàm thử camera sau nếu camera trước lỗi
  const tryFallbackCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { exact: 'environment' } // Thử camera sau
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setIsCameraReady(true);
        setCameraStream(stream);
        return true;
      }
    } catch (error) {
      console.error('Không thể truy cập camera sau:', error);
      return false;
    }
    return false;
  };

  // Start camera
  const startCamera = async () => {
    try {
      // Dừng camera hiện tại nếu đang chạy
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      setIsCameraReady(false);
      setShowCamera(true);

      // Thử camera trước trước
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { exact: 'user' } // Ưu tiên camera trước
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraStream(stream);
        
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          
          // Đợi dữ liệu video sẵn sàng
          await new Promise<void>((resolve) => {
            video.onloadeddata = () => resolve();
          });
          
          // Phát video
          await video.play();
          setIsCameraReady(true);
        }
      } catch (error) {
        console.error('Lỗi camera trước, thử camera sau...', error);
        const fallbackSuccess = await tryFallbackCamera();
        if (!fallbackSuccess) {
          throw new Error('Không thể truy cập camera');
        }
      }
    } catch (error) {
      console.error('Lỗi khi truy cập camera:', error);
      addToast({
        type: 'error',
        title: 'Không thể truy cập camera',
        message: 'Vui lòng kiểm tra quyền truy cập camera và thử lại.'
      });
      stopCamera();
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Đặt kích thước canvas bằng kích thước video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        try {
          // Vẽ frame hiện tại của video lên canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Lấy dữ liệu ảnh từ canvas
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageDataUrl);
          
          // Dừng camera sau khi chụp
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.error('Lỗi khi chụp ảnh:', error);
          addToast({
            type: 'error',
            title: 'Lỗi',
            message: 'Không thể chụp ảnh. Vui lòng thử lại.'
          });
        }
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
      }
    }
  };

  // Confirm captured photo
  const confirmCapturedPhoto = () => {
    if (capturedImage) {
      // Convert data URL to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(capturedImage);
          stopCamera();
          setResult(null);
        });
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleImageSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File quá lớn',
        message: 'Vui lòng chọn ảnh nhỏ hơn 10MB'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'File không hợp lệ',
        message: 'Vui lòng chọn file ảnh'
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      addToast({
        type: 'error',
        title: 'Chưa chọn ảnh',
        message: 'Vui lòng chọn ảnh để phân tích'
      });
      return;
    }

    setAnalyzing(true);
    
    try {
      const analysisResult = await apiService.analyzeImage(selectedImage);
      setResult(analysisResult);
      addToast({
        type: 'success',
        title: 'Phân tích thành công',
        message: 'Kết quả phân tích da đã sẵn sàng!'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Phân tích thất bại',
        message: error.message || 'Có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (level: string, severity?: number) => {
    if (level === 'none' || severity === 0) return 'text-green-600 bg-green-100';
    if (level === 'mild' || (severity && severity <= 3)) return 'text-yellow-600 bg-yellow-100';
    if (level === 'moderate' || (severity && severity <= 6)) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score: number) => {
    if (score <= 0) return 'text-gray-600';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Phân tích da với AI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tải lên ảnh khuôn mặt của bạn để nhận được phân tích chi tiết về tình trạng da 
          và khuyến nghị chăm sóc cá nhân hóa
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chọn ảnh để phân tích
            </h2>
            
            {!showCamera && !imagePreview ? (
              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Kéo thả ảnh vào đây
                      </p>
                      <p className="text-gray-500">
                        hoặc nhấn để chọn file
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      Hỗ trợ JPG, PNG (tối đa 10MB)
                    </p>
                  </div>
                </div>
                
                {/* Camera Option */}
                <div className="text-center">
                  <div className="text-gray-500 text-sm mb-3">hoặc</div>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Chụp ảnh từ camera</span>
                  </button>
                </div>
              </div>
            ) : showCamera ? (
              <div className="space-y-4">
                {/* Camera View */}
                <div className="relative bg-black rounded-xl overflow-hidden">
                  {!capturedImage ? (
                    <div className="relative w-full h-64 md:h-96">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
                        onCanPlay={() => {
                          console.log('Video is ready to play');
                          setIsCameraReady(true);
                        }}
                        onError={(e) => {
                          console.error('Video error:', e);
                          tryFallbackCamera();
                        }}
                      />
                      {!isCameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                          <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                            <p>Đang khởi động camera...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-64 md:h-96 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-96 bg-gray-100 flex items-center justify-center text-gray-400">
                      <span>Không có ảnh</span>
                    </div>
                  )}
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    {!capturedImage ? (
                      <>
                        <button
                          onClick={stopCamera}
                          className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <button
                          onClick={capturePhoto}
                          className="w-16 h-16 bg-white text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                        >
                          <Camera className="w-8 h-8" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={retakePhoto}
                          className="w-12 h-12 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                        >
                          <RotateCcw className="w-6 h-6" />
                        </button>
                        <button
                          onClick={confirmCapturedPhoto}
                          className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                        <button
                          onClick={stopCamera}
                          className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="text-center text-sm text-gray-600">
                  {!capturedImage ? (
                    <p>Đặt khuôn mặt vào khung hình và nhấn nút chụp</p>
                  ) : (
                    <p>Xem lại ảnh và chọn "Xác nhận" để sử dụng hoặc "Chụp lại"</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <span>Không có ảnh</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Phân tích ngay</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Mẹo để có kết quả tốt nhất
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Chụp ảnh trong ánh sáng tự nhiên</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Khuôn mặt thẳng, không trang điểm</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Ảnh rõ nét, không bị mờ</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Tóc không che khuôn mặt</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Có thể chụp trực tiếp từ camera</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Overall Score */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-center space-y-4">
                  <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore > 0 ? `${result.overallScore}/10` : 'Chưa đánh giá'}
                  </div>
                  <div className="text-gray-600">Điểm tổng quan</div>
                  <div className="inline-block px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                    {result.skinTypeVietnamese && result.skinTypeVietnamese !== 'Không xác định' ? result.skinTypeVietnamese : 'Chưa xác định'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Độ tin cậy: {Math.round((result.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>

              {/* Skin Concerns */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Tình trạng da
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Mụn</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.concerns.acne.level, result.concerns.acne.severity)}`}>
                      {result.concerns.acne.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Nếp nhăn</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.concerns.wrinkles.level, result.concerns.wrinkles.severity)}`}>
                      {result.concerns.wrinkles.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Đốm nâu</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.concerns.darkSpots.level, result.concerns.darkSpots.severity)}`}>
                      {result.concerns.darkSpots.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Lỗ chân lông</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.concerns.poreSize.level)}`}>
                      {result.concerns.poreSize.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.concerns.oiliness}/10
                      </div>
                      <div className="text-sm text-gray-600">Độ dầu</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-teal-600">
                        {result.concerns.hydration}/10
                      </div>
                      <div className="text-sm text-gray-600">Độ ẩm</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Phân tích chi tiết
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">✅ Điểm mạnh</h4>
                    <ul className="space-y-1">
                      {(Array.isArray(result?.analysis?.strengths) ? result.analysis.strengths : []).map((strength, index) => (
                        <li key={index} className="text-gray-600 text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2">⚠️ Cần chú ý</h4>
                    <ul className="space-y-1">
                      {(Array.isArray(result?.analysis?.concerns) ? result.analysis.concerns : []).map((concern, index) => (
                        <li key={index} className="text-gray-600 text-sm">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-1">🎯 Ưu tiên</h4>
                    <p className="text-blue-600 text-sm">{result.analysis.priority}</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Khuyến nghị chăm sóc
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">📋 Lời khuyên</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-600 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Routine */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Routine được đề xuất
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-3">🌅 Buổi sáng</h4>
                    <ol className="space-y-2">
                      {result.routine.morning.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-gray-600 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-600 mb-3">🌙 Buổi tối</h4>
                    <ol className="space-y-2">
                      {result.routine.evening.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-gray-600 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có kết quả phân tích
              </h3>
              <p className="text-gray-500">
                Tải lên ảnh và nhấn "Phân tích ngay" để xem kết quả
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;