import React from 'react';
import { 
  Camera, 
  User, 
  Calendar, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const navItems = [
    { icon: Camera, label: 'Phân Tích' },
    { icon: Sparkles, label: 'Tư Vấn' },
    { icon: Calendar, label: 'Routine' },
    { icon: TrendingUp, label: 'Tiến Triển' },
    { icon: User, label: 'Hồ Sơ' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, index) => (
          <button
            key={index}
            className="flex flex-col items-center space-y-1 py-2 px-3 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;