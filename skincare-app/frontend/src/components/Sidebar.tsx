import React from 'react';
import { 
  Camera, 
  User, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { icon: Camera, label: 'Phân Tích Da', path: '/analysis' },
  { icon: Sparkles, label: 'Tư Vấn', path: '/recommendations' },
  { icon: Calendar, label: 'Routine', path: '/routine' },
  { icon: TrendingUp, label: 'Tiến Triển', path: '/progress' },
  { icon: User, label: 'Hồ Sơ', path: '/profile' },
  { icon: Settings, label: 'Cài Đặt', path: '/settings' },
];

const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-30">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
            SkinCare AI
          </h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;