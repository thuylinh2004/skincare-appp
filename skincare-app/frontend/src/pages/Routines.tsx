import React, { useState, useEffect } from 'react';
import { Plus, Clock, Edit, Trash2, Sun, Moon, Calendar, Eye } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiService } from '../services/api';

interface RoutineStepForm {
  id?: string;
  order: number;
  product_name: string;    // Tên sản phẩm
  product: string;         // Tên sản phẩm (đồng bộ với product_name)
  instructions: string;    // Hướng dẫn sử dụng
  description: string;     // Mô tả chi tiết
  duration: string;        // Giá trị thời gian
  durationUnit: 'phút' | 'giây'; // Đơn vị thời gian
  tips?: string;           // Mẹo sử dụng
  benefits?: string;       // Lợi ích 
  product_id?: string | null; // ID sản phẩm (nếu có)
}

interface RoutineStep extends Omit<RoutineStepForm, 'duration' | 'durationUnit'> {
  duration?: string;      // Thời gian thực hiện (định dạng: "số đơn_vị")
  [key: string]: any;     // Cho phép các trường mở rộng
}

interface Routine {
  id: string;
  name: string;
  time_of_day: 'morning' | 'evening' | 'weekly';
  steps: RoutineStep[];
  active: boolean;
  created_at: string;
  updated_at: string;
  readOnly?: boolean;     // Cờ chỉ đọc cho routine AI
}

const Routines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);  // Danh sách routine
  const [loading, setLoading] = useState(true);            // Trạng thái tải dữ liệu
  const [showCreateModal, setShowCreateModal] = useState(false);  // Hiển thị modal tạo mới
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);  // Routine đang chỉnh sửa
  const [generating, setGenerating] = useState(false);     // Trạng thái tạo routine AI
  const [showAllSteps, setShowAllSteps] = useState<Record<string, boolean>>({}); // Trạng thái hiển thị tất cả bước
  const { addToast } = useToast();                        // Hook hiển thị thông báo

  // Tùy chọn thời gian trong ngày
  const timeOfDayOptions = [
    { value: 'morning', label: 'Buổi sáng', icon: Sun, color: 'text-yellow-600 bg-yellow-100' },
    { value: 'evening', label: 'Buổi tối', icon: Moon, color: 'text-purple-600 bg-purple-100' },
    { value: 'weekly', label: 'Hàng tuần', icon: Calendar, color: 'text-green-600 bg-green-100' }
  ];

  // Lấy danh sách routine khi component mount
  useEffect(() => {
    fetchRoutines();
  }, []);

  // Gọi API để lấy danh sách routine
  const fetchRoutines = async () => {
    try {
      const data = await apiService.getRoutines();
      setRoutines(data);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: error.message || 'Không thể tải danh sách routine'
      });
    } finally {
      setLoading(false);
    }
  };

  // Tạo routine bằng AI
  const handleGenerateAI = async () => {
    try {
      setGenerating(true);
      const generated = await apiService.generateAIRoutines();
      setRoutines(prev => [...generated, ...prev]);  // Thêm routine mới vào đầu danh sách
      addToast({
        type: 'success',
        title: 'Đã tạo routine AI',
        message: 'Đã thêm routine buổi sáng/tối dựa trên tiến trình và phân tích'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Tạo bằng AI thất bại',
        message: error.message || 'Không thể tạo routine AI'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Xóa routine AI
  const handleDeleteRoutine = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa routine này?')) return;

    try {
      await apiService.deleteRoutine(id);
      setRoutines(prev => prev.filter(r => r.id !== id));
      addToast({
        type: 'success',
        title: 'Xóa thành công',
        message: 'Routine đã được xóa'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Xóa thất bại',
        message: error.message || 'Có lỗi xảy ra'
      });
    }
  };

  // Lưu routine (tạo mới hoặc cập nhật)
  const handleSaveRoutine = async (routine: Routine) => {
    try {
      const formattedSteps = routine.steps
        .filter(step => (step.product || step.product_name || '').trim() !== '')
        .map((step, index) => ({
          product_name: step.product || step.product_name || `Bước ${index + 1}`,
          instructions: step.description || step.instructions || '',
          order: step.order || index + 1,
          duration: step.duration || '',
          tips: step.tips || '',
          benefits: step.benefits || '',
          product_id: step.product_id || null,
          ...(step.id && { id: step.id })
        }));

      if (routine.id) {
        await apiService.updateRoutine(routine.id, {
          name: routine.name,
          time_of_day: routine.time_of_day,
          steps: formattedSteps,
          active: routine.active !== false
        });
      } else {
        await apiService.createRoutine({
          name: routine.name,
          time_of_day: routine.time_of_day,
          steps: formattedSteps,
          active: true
        });
      }

      // Làm mới toàn bộ danh sách từ server để đảm bảo đồng bộ
      const updatedRoutines = await apiService.getRoutines();
      setRoutines(updatedRoutines);

      addToast({
        type: 'success',
        title: routine.id ? 'Cập nhật thành công' : 'Tạo mới thành công',
        message: `Đã ${routine.id ? 'cập nhật' : 'tạo'} routine "${routine.name}"`
      });
    } catch (error: any) {
      console.error('Lỗi khi lưu routine:', error);
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi lưu routine'
      });
    } finally {
      setEditingRoutine(null);
    }
  };

  // Xem chi tiết routine AI
  const handleViewAIRoutine = (routine: Routine) => {
    setEditingRoutine({
      ...routine,
      readOnly: true
    });
  };

  // Chuyển đổi trạng thái active của routine
  const handleToggleActive = async (routine: Routine) => {
    try {
      const originalSteps = routine.steps || [];
      const updated = await apiService.updateRoutine(routine.id, {
        active: !routine.active
      });

      setRoutines(prev => prev.map(r => 
        r.id === routine.id 
          ? { ...r, ...updated, steps: originalSteps, active: !routine.active } 
          : r
      ));

      addToast({
        type: 'success',
        title: !routine.active ? 'Đã bật routine' : 'Đã tắt routine',
        message: `Routine "${routine.name}" đã được ${!routine.active ? 'bật' : 'tắt'}`
      });
    } catch (error: any) {
      console.error('Lỗi khi thay đổi trạng thái:', error);
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: error.message || 'Có lỗi xảy ra'
      });
    }
  };

  // Lấy thông tin thời gian trong ngày
  const getTimeOfDayInfo = (timeOfDay: string) => {
    return timeOfDayOptions.find(option => option.value === timeOfDay) || timeOfDayOptions[0];
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Routine chăm sóc da</h1>
          <p className="text-lg text-gray-600 mt-2">Quản lý routine chăm sóc da cá nhân của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>{generating ? 'Đang tạo...' : 'Tạo routine mới'}</span>
          </button>
        </div>
      </div>

      {/* Danh sách routine */}
      {routines.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có routine nào</h3>
          <p className="text-gray-500">Vui lòng nhấn nút "Tạo routine mới" ở góc trên bên phải để bắt đầu</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => {
            const timeInfo = getTimeOfDayInfo(routine.time_of_day);
            const IconComponent = timeInfo.icon;
            
            return (
              <div
                key={routine.id}
                className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${
                  !routine.active ? 'opacity-60' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${timeInfo.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{routine.name}</h3>
                      <p className="text-sm text-gray-500">{timeInfo.label}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {routine.name.includes('(AI)') ? (
                      <button
                        onClick={() => handleViewAIRoutine(routine)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingRoutine(routine)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Các bước */}
                <div className="space-y-2 mb-4">
                  {(routine.steps || [])
                    .slice(0, showAllSteps[routine.id] ? routine.steps.length : 3)
                    .map((step, index) => {
                      const productName = step.product_name || step.product || `Bước ${index + 1}`;
                      const description = step.instructions || step.description || '';
                      const duration = step.duration || '';
                      
                      return (
                        <div key={step.id || index} className="flex items-start space-x-3">
                          <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {step.order || index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{productName}</p>
                            {description && <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{description}</p>}
                          </div>
                          {duration && <span className="text-xs text-gray-400">{duration}</span>}
                        </div>
                      );
                    })}
                  {routine.steps && routine.steps.length > 3 && (
                    <button
                      onClick={() => setShowAllSteps(prev => ({
                        ...prev,
                        [routine.id]: !prev[routine.id]
                      }))}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {showAllSteps[routine.id] 
                        ? 'Thu gọn' 
                        : 'Xem thêm'}
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{routine.steps.length} bước</span>
                  <button
                    onClick={() => handleToggleActive(routine)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      routine.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {routine.active ? 'Đang hoạt động' : 'Đã tắt'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo/chỉnh sửa routine */}
      {(showCreateModal || editingRoutine) && (
        <RoutineModal
          routine={editingRoutine}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRoutine(null);
          }}
          onSave={handleSaveRoutine}
        />
      )}
    </div>
  );
};

// Component Modal cho routine
const RoutineModal: React.FC<{
  routine: (Routine & { readOnly?: boolean }) | null;
  onClose: () => void;
  onSave: (routine: Routine) => void;
}> = ({ routine, onClose, onSave }) => {
  const isReadOnly = routine?.readOnly || false;

  // Hàm tạo bước mới
  const createNewStep = (order: number): RoutineStepForm => ({
    id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order,
    product: '',
    product_name: '',
    description: '',
    instructions: '',
    duration: '',
    durationUnit: 'phút',
    tips: '',
    benefits: '',
    product_id: null
  });

  const [formData, setFormData] = useState<{
    name: string;
    time_of_day: 'morning' | 'evening' | 'weekly';
    steps: RoutineStepForm[];
  }>(() => {
    // Nếu đang chỉnh sửa routine có sẵn
    if (routine?.steps?.length) {
      return {
        name: routine.name || '',
        time_of_day: routine.time_of_day || 'morning',
        steps: routine.steps.map(step => {
          // Parse duration string like "2 phút" or "30 giây"
          let durationValue = '';
          let durationUnit: 'phút' | 'giây' = 'phút';
          
          if (step.duration) {
            // Handle duration formats like "30 giây - 1 phút" by taking the first value
            const durationParts = step.duration.split('-')[0].trim().split(' ');
            if (durationParts.length >= 2) {
              durationValue = durationParts[0];
              durationUnit = durationParts[1] === 'giây' ? 'giây' : 'phút';
            } else if (durationParts.length === 1 && !isNaN(Number(durationParts[0]))) {
              durationValue = durationParts[0];
            }
          }
          
          return {
            id: step.id,
            order: step.order || 1,
            product: step.product_name || step.product || '',
            product_name: step.product_name || step.product || '',
            description: step.description || step.instructions || '',
            instructions: step.instructions || step.description || '',
            duration: durationValue,
            durationUnit: durationUnit,
            tips: step.tips || '',
            benefits: step.benefits || '',
            product_id: step.product_id || null
          };
        }).filter(step => step.product.trim() !== '')
      };
    }
    
    // Nếu tạo mới, thêm bước 1 mặc định
    return {
      name: '',
      time_of_day: 'morning',
      steps: [createNewStep(1)]
    };
  });
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  // Tùy chọn thời gian
  const timeOfDayOptions = [
    { value: 'morning', label: 'Buổi sáng' },
    { value: 'evening', label: 'Buổi tối' },
    { value: 'weekly', label: 'Hàng tuần' }
  ];

  // Thêm bước mới
  const handleAddStep = () => {
    setFormData(prev => {
      const newStep = createNewStep(prev.steps.length + 1);
      return {
        ...prev,
        steps: [...prev.steps, newStep]
      };
    });
  };

  // Xóa bước
  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  // Cập nhật thông tin bước
  const handleStepChange = (index: number, field: keyof RoutineStepForm | 'durationValue', value: string) => {
    setFormData(prev => {
      const updatedSteps = [...prev.steps];
      const currentStep = { ...updatedSteps[index] };
      
      // Handle special cases first
      if (field === 'durationValue') {
        currentStep.duration = value;
      } else if (field === 'durationUnit') {
        currentStep.durationUnit = value as 'phút' | 'giây';
      } else if (field === 'product') {
        // Sync product and product_name
        currentStep.product = value;
        currentStep.product_name = value;
      } else if (field === 'description') {
        // Sync description and instructions
        currentStep.description = value;
        currentStep.instructions = value;
      } else if (field in currentStep) {
        // Handle all other fields that exist in RoutineStepForm
        (currentStep as any)[field] = value;
      }
      
      updatedSteps[index] = currentStep;
      
      return {
        ...prev,
        steps: updatedSteps
      };
    });
  };

  // Lưu routine
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Vui lòng nhập tên routine' });
      return;
    }

    try {
      setSaving(true);
      // Chuẩn bị dữ liệu bước để lưu
      const stepsToSave = formData.steps
        .filter(step => step.product.trim() !== '')
        .map((step, index) => {
          // Định dạng duration đúng cách
          const durationValue = step.duration && step.duration.trim() !== ''
            ? `${step.duration} ${step.durationUnit || 'phút'}`
            : '';
          
          // Tạo đối tượng stepData với đầy đủ các trường
          const stepData: RoutineStep = {
            id: step.id,
            order: index + 1,
            product_name: step.product_name || step.product || `Bước ${index + 1}`,
            product: step.product || step.product_name || `Bước ${index + 1}`,
            instructions: step.instructions || step.description || '',
            description: step.description || step.instructions || '',
            duration: durationValue,
            tips: step.tips || '',
            benefits: step.benefits || '',
            product_id: step.product_id || null
          };
          
          return stepData;
        });

      const routineData = {
        name: formData.name.trim(),
        time_of_day: formData.time_of_day,
        steps: stepsToSave,
        active: routine?.active ?? true,
        ...(routine?.id && { id: routine.id })
      };

      if (routine?.id) {
        const updatedRoutine = await apiService.updateRoutine(routine.id, routineData);
        onSave(updatedRoutine);
      } else {
        const newRoutine = await apiService.createRoutine(routineData);
        onSave(newRoutine);
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu routine:', error);
      addToast({ type: 'error', title: 'Lỗi', message: error.message || 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isReadOnly ? 'Chi tiết' : routine ? 'Chỉnh sửa' : 'Tạo mới'} Routine
              {isReadOnly && <span className="ml-2 text-sm font-normal text-blue-600">(AI)</span>}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Thông tin cơ bản */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên routine *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ví dụ: Routine sáng cơ bản"
                readOnly={isReadOnly}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian thực hiện</label>
              <select
                className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-50' : 'bg-white'} border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                value={formData.time_of_day}
                onChange={(e) =>
                  !isReadOnly && setFormData({ ...formData, time_of_day: e.target.value as 'morning' | 'evening' | 'weekly' })
                }
                disabled={isReadOnly}
              >
                {timeOfDayOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Các bước */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Các bước thực hiện</label>
              {!isReadOnly && (
                <button type="button" onClick={handleAddStep} className="text-sm text-blue-600 hover:text-blue-800">
                  + Thêm bước
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-700">Bước {index + 1}</span>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveStep(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={step.product}
                        onChange={(e) => {
                          handleStepChange(index, 'product', e.target.value);
                          handleStepChange(index, 'product_name', e.target.value);
                        }}
                        className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        placeholder="Ví dụ: Sữa rửa mặt"
                        required
                        readOnly={isReadOnly}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Thời gian (tùy chọn)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={step.duration}
                            onChange={(e) => handleStepChange(index, 'duration', e.target.value)}
                            className={`flex-1 px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            placeholder="Số"
                            readOnly={isReadOnly}
                          />
                          <select
                            value={step.durationUnit || 'phút'}
                            onChange={(e) => handleStepChange(index, 'durationUnit', e.target.value)}
                            className={`px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            disabled={isReadOnly}
                          >
                            <option value="phút">phút</option>
                            <option value="giây">giây</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ID Sản phẩm (nếu có)</label>
                        <input
                          type="text"
                          value={step.product_id || ''}
                          onChange={(e) => handleStepChange(index, 'product_id', e.target.value)}
                          className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          placeholder="ID sản phẩm từ danh mục"
                          readOnly={isReadOnly}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả chi tiết *</label>
                      <textarea
                        value={step.description}
                        onChange={(e) => {
                          handleStepChange(index, 'description', e.target.value);
                          handleStepChange(index, 'instructions', e.target.value);
                        }}
                        className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        placeholder="Mô tả chi tiết các bước thực hiện"
                        rows={3}
                        required
                        readOnly={isReadOnly}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Hướng dẫn chi tiết</label>
                      <textarea
                        value={step.instructions || ''}
                        onChange={(e) => handleStepChange(index, 'instructions', e.target.value)}
                        className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        placeholder="Hướng dẫn chi tiết từng bước thực hiện"
                        rows={3}
                        readOnly={isReadOnly}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mẹo sử dụng</label>
                      <textarea
                        value={step.tips || ''}
                        onChange={(e) => handleStepChange(index, 'tips', e.target.value)}
                        className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        placeholder="Các mẹo hữu ích khi sử dụng sản phẩm"
                        rows={2}
                        readOnly={isReadOnly}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Lợi ích</label>
                      <textarea
                        value={step.benefits || ''}
                        onChange={(e) => handleStepChange(index, 'benefits', e.target.value)}
                        className={`w-full px-3 py-2 border ${isReadOnly ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        placeholder="Lợi ích của sản phẩm"
                        rows={2}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hành động */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {isReadOnly ? 'Đóng' : 'Hủy'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Routines;