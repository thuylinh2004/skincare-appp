import React, { useState } from 'react';
import { 
  Sparkles, 
  Camera, 
  Brain, 
  TrendingUp, 
  Shield, 
  Users,
  Check,
  Star
} from 'lucide-react';
import AuthModal from './Auth/AuthModal';

const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: Camera,
      title: 'Phân Tích Da Thông Minh',
      description: 'Công nghệ AI hiện đại phân tích chính xác tình trạng da từ hình ảnh',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'Tư Vấn Cá Nhân Hóa',
      description: 'Gợi ý sản phẩm và routine phù hợp với từng loại da và nhu cầu',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Theo Dõi Tiến Triển',
      description: 'Theo dõi sự thay đổi của da theo thời gian với biểu đồ trực quan',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Shield,
      title: 'An Toàn & Bảo Mật',
      description: 'Dữ liệu cá nhân được mã hóa và bảo vệ theo tiêu chuẩn quốc tế',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const benefits = [
    'Phân tích da chính xác với AI',
    'Routine skincare cá nhân hóa',
    'Theo dõi tiến triển theo thời gian',
    'Gợi ý sản phẩm phù hợp',
    'Nhắc nhở chăm sóc da hàng ngày',
    'Cộng đồng chia sẻ kinh nghiệm'
  ];

  const testimonials = [
    {
      name: 'Minh Anh',
      rating: 5,
      comment: 'Ứng dụng đã giúp tôi cải thiện da rất nhiều. Gợi ý sản phẩm rất chính xác!'
    },
    {
      name: 'Thu Hà',
      rating: 5,
      comment: 'Tính năng phân tích da thật tuyệt vời. Giờ tôi biết chính xác da mình cần gì.'
    },
    {
      name: 'Quốc Dũng',
      rating: 5,
      comment: 'Interface đẹp, dễ sử dụng. Routine skincare của tôi đã có cải thiện rõ rệt.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                SkinCare AI
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-teal-500 to-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:from-teal-600 hover:to-purple-600 transition-all"
              >
                Bắt Đầu Ngay
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="block">Phân Tích Da Thông Minh</span>
              <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                Với Công Nghệ AI
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Khám phá tình trạng da của bạn với công nghệ AI hiện đại. 
              Nhận gợi ý skincare cá nhân hóa và theo dõi tiến triển theo thời gian.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-teal-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
              >
                <Camera className="w-5 h-5 inline mr-2" />
                Phân Tích Da Ngay
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-teal-300 hover:text-teal-600 transition-all">
                Tìm Hiểu Thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tính Năng Vượt Trội
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trải nghiệm công nghệ skincare thông minh với các tính năng độc đáo
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-teal-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Tại Sao Chọn SkinCare AI?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Ứng dụng hàng đầu về phân tích da và tư vấn skincare thông minh
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="aspect-square bg-gradient-to-br from-teal-100 to-purple-100 rounded-xl mb-6 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Trải Nghiệm Miễn Phí
              </h3>
              <p className="text-gray-600 mb-6">
                Dùng thử tất cả tính năng miễn phí trong 7 ngày đầu tiên
              </p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-teal-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-purple-600 transition-all"
              >
                Đăng Ký Ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Người Dùng Nói Gì Về Chúng Tôi
            </h2>
            <p className="text-xl text-gray-600">
              Hàng nghìn người dùng đã tin tưởng và đạt được kết quả tốt
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                <p className="font-semibold text-gray-900">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-purple-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn Sàng Khám Phá Da Của Bạn?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Bắt đầu hành trình skincare thông minh ngay hôm nay
          </p>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Bắt Đầu Miễn Phí
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">SkinCare AI</h3>
            </div>
            <p className="text-gray-400 mb-8">
              Công nghệ AI tiên tiến cho làn da khỏe mạnh và rạng rỡ
            </p>
            <div className="flex items-center justify-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Về Chúng Tôi</a>
              <a href="#" className="hover:text-white transition-colors">Điều Khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo Mật</a>
              <a href="#" className="hover:text-white transition-colors">Liên Hệ</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500">
              <p>&copy; 2025 SkinCare AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default LandingPage;