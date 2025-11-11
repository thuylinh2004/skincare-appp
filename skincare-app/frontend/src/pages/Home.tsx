import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Camera, TrendingUp, Shield, Users, Award } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Camera,
      title: 'Phân tích da AI',
      description: 'Sử dụng công nghệ AI Gemini để phân tích tình trạng da chính xác',
      color: 'from-blue-500 to-teal-500'
    },
    {
      icon: TrendingUp,
      title: 'Theo dõi tiến triển',
      description: 'Ghi lại và theo dõi sự thay đổi của da theo thời gian',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Routine cá nhân',
      description: 'Tạo routine chăm sóc da phù hợp với tình trạng da của bạn',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Award,
      title: 'Khuyến nghị thông minh',
      description: 'Nhận gợi ý sản phẩm và liệu pháp phù hợp từ AI',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Người dùng tin tưởng' },
    { number: '50,000+', label: 'Lần phân tích' },
    { number: '95%', label: 'Độ chính xác' },
    { number: '4.8/5', label: 'Đánh giá người dùng' }
  ];

  return (
    <div className="space-y-20">
      {/* Khu vực Hero (giới thiệu) */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Chăm sóc da thông minh với
            <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent"> AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Phân tích tình trạng da chính xác, nhận khuyến nghị cá nhân hóa và theo dõi tiến triển 
            chăm sóc da của bạn với công nghệ AI tiên tiến
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link
              to="/analysis"
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Camera className="w-5 h-5 inline mr-2" />
              Bắt đầu phân tích
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Bắt đầu miễn phí
              </Link>
            </>
          )}
        </div>

        {/* Ảnh minh họa Hero */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-2xl p-8">
            <img
              src="https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg"
              alt="Skincare Analysis"
              className="w-full h-64 md:h-96 object-cover rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Khu vực tính năng */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Tính năng nổi bật
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá những tính năng mạnh mẽ giúp bạn chăm sóc da hiệu quả hơn
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Khu vực thống kê */}
      <section className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-8 md:p-12 text-white">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Được tin tưởng bởi hàng ngàn người dùng
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-teal-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kêu gọi hành động (CTA) */}
      {!user && (
        <section className="text-center space-y-8 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Sẵn sàng bắt đầu hành trình chăm sóc da?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tham gia cùng hàng ngàn người dùng đã tin tưởng SkinCare AI để có làn da khỏe mạnh hơn
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Đăng ký miễn phí ngay
          </Link>
        </section>
      )}
    </div>
  );
};

export default Home;