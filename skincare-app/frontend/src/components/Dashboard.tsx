import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SkinAnalyzer from './SkinAnalyzer';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const quickStats = [
    { label: 'Điểm Da', value: '8.2/10', icon: Award, color: 'from-green-500 to-emerald-500' },
    { label: 'Routine Streak', value: '12 ngày', icon: Target, color: 'from-purple-500 to-pink-500' },
    { label: 'Cải Thiện', value: '+15%', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
    { label: 'Nhắc Nhở', value: '3 hôm nay', icon: Bell, color: 'from-orange-500 to-red-500' },
  ];

  if (showAnalyzer) {
    return <SkinAnalyzer onBack={() => setShowAnalyzer(false)} />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Hôm nay bạn có vẻ rạng rỡ hơn</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button 
          onClick={() => setShowAnalyzer(true)}
          className="group bg-gradient-to-r from-teal-500 to-purple-500 p-6 rounded-2xl text-white hover:from-teal-600 hover:to-purple-600 transition-all transform hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold mb-1">Phân Tích Da</h3>
              <p className="text-teal-100">Chụp ảnh để phân tích tình trạng da hiện tại</p>
            </div>
          </div>
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Gợi Ý Hôm Nay</h3>
              <p className="text-gray-600">Dựa trên phân tích gần nhất</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Sử dụng serum Vitamin C buổi sáng</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Uống đủ 2L nước trong ngày</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Đắp mặt nạ dưỡng ẩm tối nay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analysis */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Phân Tích Gần Đây</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600 mb-1">3 ngày trước</div>
              <div className="text-sm font-medium text-gray-900 mb-2">Điểm da: 7.8/10</div>
              <div className="flex space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Da khỏe</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Cần dưỡng ẩm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Routine */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Routine Hôm Nay</h3>
          <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">
            Chỉnh sửa
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              Buổi Sáng
            </h4>
            <div className="space-y-2">
              {['Rửa mặt', 'Toner', 'Serum Vitamin C', 'Kem dưỡng ẩm', 'Kem chống nắng'].map((step, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              Buổi Tối
            </h4>
            <div className="space-y-2">
              {['Tẩy trang', 'Rửa mặt', 'Toner', 'Serum Retinol', 'Kem dưỡng ẩm ban đêm'].map((step, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;