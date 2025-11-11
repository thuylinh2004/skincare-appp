import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toaster';
import { User, Calendar, Palette, AlertCircle, Save, Camera } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiService } from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  skin_type: string | null;
  skin_concerns: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    skin_type: '',
    skin_concerns: [] as string[]
  });

  const skinTypes = [
    { value: 'normal', label: 'Da bình thường' },
    { value: 'oily', label: 'Da dầu' },
    { value: 'dry', label: 'Da khô' },
    { value: 'combination', label: 'Da hỗn hợp' },
    { value: 'sensitive', label: 'Da nhạy cảm' }
  ];

  const skinConcernOptions = [
    'Mụn trứng cá',
    'Nếp nhăn',
    'Đốm nâu',
    'Lỗ chân lông to',
    'Da khô',
    'Da dầu',
    'Mất độ đàn hồi',
    'Tàn nhang'
  ];

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const profileData = await apiService.getProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        age: profileData.age?.toString() || '',
        skin_type: profileData.skin_type || '',
        skin_concerns: profileData.skin_concerns || []
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: error.message || 'Không thể tải thông tin hồ sơ'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConcernChange = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      skin_concerns: prev.skin_concerns.includes(concern)
        ? prev.skin_concerns.filter(c => c !== concern)
        : [...prev.skin_concerns, concern]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Vui lòng nhập họ và tên'
      });
      return;
    }

    setSaving(true);
    
    try {
      const updatedProfile = await apiService.updateProfile({
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        skin_type: formData.skin_type || null,
        skin_concerns: formData.skin_concerns
      });
      
      setProfile(updatedProfile);
      // Refetch to ensure latest data from server (avoid any local mismatch)
      await fetchProfile();
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin hồ sơ đã được lưu'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: error.message || 'Có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Tiêu đề */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Hồ sơ cá nhân
        </h1>
        <p className="text-lg text-gray-600">
          Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tóm tắt hồ sơ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6">
            {/* Ảnh đại diện */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {profile?.name || 'Chưa cập nhật'}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>

            {/* Thống kê nhanh */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tuổi</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.age || 'Chưa cập nhật'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Loại da</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.skin_type ? 
                    skinTypes.find(t => t.value === profile.skin_type)?.label || profile.skin_type
                    : 'Chưa cập nhật'
                  }
                </span>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Vấn đề về da</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile?.skin_concerns && profile.skin_concerns.length > 0 ? (
                    profile.skin_concerns.map((concern, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full"
                      >
                        {concern}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Chưa cập nhật</span>
                  )}
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Thành viên từ {new Date(profile?.created_at || '').toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Biểu mẫu hồ sơ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin cá nhân
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="13"
                      max="100"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Nhập tuổi"
                    />
                  </div>
                </div>
              </div>

              {/* Skin Type */}
              <div>
                <label htmlFor="skin_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Loại da
                </label>
                <select
                  id="skin_type"
                  name="skin_type"
                  value={formData.skin_type}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Chọn loại da của bạn</option>
                  {skinTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skin Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vấn đề về da (có thể chọn nhiều)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skinConcernOptions.map((concern) => (
                    <label
                      key={concern}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.skin_concerns.includes(concern)}
                        onChange={() => handleConcernChange(concern)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{concern}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;