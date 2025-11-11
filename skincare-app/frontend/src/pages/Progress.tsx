import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Camera, BarChart3, Target, Award } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiService } from '../services/api';

interface AnalysisHistory {
  id: string;
  skin_score: number;
  analysis_data: any;
  created_at: string;
  image_url: string;
}

interface ProgressEntry {
  id: string;
  notes: string;
  skin_score: number;
  created_at: string;
  analysis_id?: string;
}

const Progress = () => {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'progress'>('history');
  const { addToast } = useToast();
  // State cho form tạo ghi chú tiến triển
  const [newNotes, setNewNotes] = useState('');
  const [newScore, setNewScore] = useState<string>('');
  const [saving, setSaving] = useState(false);
  // Modal chỉnh sửa ghi chú
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editScore, setEditScore] = useState<string>('');
  // Modal xem chi tiết phân tích
  const [analysisDetail, setAnalysisDetail] = useState<any | null>(null);
  const [analysisDetailLoading, setAnalysisDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyData, progressData] = await Promise.all([
        apiService.getAnalysisHistory(),
        apiService.getProgressEntries()
      ]);
      
      setAnalysisHistory(historyData);
      setProgressEntries(progressData);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: error.message || 'Không thể tải dữ liệu tiến triển'
      });
    } finally {
      setLoading(false);
    }
  };

  const openAnalysisDetail = async (id: string) => {
    try {
      setAnalysisDetailLoading(true);
      const detail = await apiService.getAnalysisById(id);
      setAnalysisDetail(detail);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Lỗi', message: error?.message || 'Không thể tải chi tiết phân tích' });
    } finally {
      setAnalysisDetailLoading(false);
    }
  };

  const openEditModal = (entry: ProgressEntry) => {
    setEditingEntry(entry);
    setEditNotes(entry.notes);
    setEditScore(String(entry.skin_score));
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const parsed = parseFloat(editScore);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      addToast({ type: 'error', title: 'Điểm không hợp lệ', message: 'Vui lòng nhập điểm từ 0 đến 10' });
      return;
    }
    try {
      const updated = await apiService.updateProgressEntry(editingEntry.id, {
        notes: editNotes.trim(),
        skin_score: parsed,
      });
      setProgressEntries(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingEntry(null);
      addToast({ type: 'success', title: 'Đã cập nhật', message: 'Ghi chú đã được cập nhật' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Cập nhật thất bại', message: error?.message || 'Có lỗi xảy ra' });
    }
  };

  const handleDeleteProgress = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      await apiService.deleteProgressEntry(id);
      setProgressEntries(prev => prev.filter(p => p.id !== id));
      addToast({ type: 'success', title: 'Đã xóa', message: 'Ghi chú đã được xóa' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Xóa thất bại', message: error?.message || 'Có lỗi xảy ra' });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreTrend = () => {
    if (analysisHistory.length < 2) return null;
    
    const latest = analysisHistory[0]?.skin_score || 0;
    const previous = analysisHistory[1]?.skin_score || 0;
    const diff = latest - previous;
    
    return {
      value: diff,
      isPositive: diff > 0,
      isNeutral: diff === 0
    };
  };

  const getAverageScore = () => {
    if (analysisHistory.length === 0) return 0;
    const sum = analysisHistory.reduce((acc, item) => acc + (item.skin_score || 0), 0);
    return (sum / analysisHistory.length).toFixed(1);
  };

  const getImprovementPercentage = () => {
    if (analysisHistory.length < 2) return null;
    
    const latest = analysisHistory[0]?.skin_score || 0;
    const oldest = analysisHistory[analysisHistory.length - 1]?.skin_score || 0;
    
    if (oldest === 0) return null;
    
    const improvement = ((latest - oldest) / oldest) * 100;
    return improvement.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const trend = getScoreTrend();
  const averageScore = getAverageScore();
  const improvement = getImprovementPercentage();

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newScore);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      addToast({ type: 'error', title: 'Điểm không hợp lệ', message: 'Vui lòng nhập điểm từ 0 đến 10' });
      return;
    }

    setSaving(true);
    try {
      const created = await apiService.createProgressEntry({
        notes: newNotes.trim(),
        skin_score: parsed
      });
      setProgressEntries(prev => [created, ...prev]);
      setNewNotes('');
      setNewScore('');
      addToast({ type: 'success', title: 'Đã thêm ghi chú', message: 'Ghi chú tiến triển đã được lưu' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Thêm thất bại', message: error?.message || 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Theo dõi tiến triển
        </h1>
        <p className="text-lg text-gray-600">
          Xem sự thay đổi của da theo thời gian và đánh giá hiệu quả chăm sóc
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {analysisHistory.length}
          </div>
          <div className="text-sm text-gray-600">Lần phân tích</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {averageScore}
          </div>
          <div className="text-sm text-gray-600">Điểm trung bình</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {trend ? (
              <span className={trend.isPositive ? 'text-green-600' : trend.isNeutral ? 'text-gray-600' : 'text-red-600'}>
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}
              </span>
            ) : (
              '--'
            )}
          </div>
          <div className="text-sm text-gray-600">Xu hướng gần đây</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {improvement ? (
              <span className={parseFloat(improvement) > 0 ? 'text-green-600' : 'text-red-600'}>
                {parseFloat(improvement) > 0 ? '+' : ''}{improvement}%
              </span>
            ) : (
              '--'
            )}
          </div>
          <div className="text-sm text-gray-600">Cải thiện tổng thể</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Lịch sử phân tích
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'progress'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Ghi chú tiến triển
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'history' ? (
            <div className="space-y-6">
              {analysisHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử phân tích</h3>
                  <p className="text-gray-500">Thực hiện phân tích da đầu tiên để bắt đầu theo dõi tiến triển</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {analysisHistory.map((analysis, index) => (
                    <div key={analysis.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <img src={analysis.image_url} alt="Analysis" className="w-20 h-20 rounded-lg object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.skin_score)}`}>{analysis.skin_score}/10</span>
                              {index === 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Mới nhất</span>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(analysis.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p className="mb-1"><strong>Loại da:</strong> {analysis.analysis_data?.skinTypeVietnamese || 'Không xác định'}</p>
                            {analysis.analysis_data?.analysis?.priority && (
                              <p><strong>Ưu tiên:</strong> {analysis.analysis_data.analysis.priority}</p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={() => openAnalysisDetail(analysis.id)}
                              className="px-3 py-2 text-sm font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-4">
                <form onSubmit={handleAddProgress} className="grid md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung ghi chú</label>
                    <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ví dụ: Hôm nay da bớt dầu, ít mụn hơn" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm (0–10)</label>
                    <input type="number" min={0} max={10} step={0.1} value={newScore} onChange={(e) => setNewScore(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="7.5" />
                  </div>
                  <div>
                    <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                      {saving ? 'Đang lưu...' : 'Thêm ghi chú'}
                    </button>
                  </div>
                </form>
              </div>
              {progressEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ghi chú tiến triển</h3>
                  <p className="text-gray-500">Thêm ghi chú để theo dõi sự thay đổi của da theo thời gian</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressEntries.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(entry.skin_score)}`}>{entry.skin_score}/10</span>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(entry.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => openEditModal(entry)} className="text-sm text-teal-600 hover:text-teal-700">Sửa</button>
                          <button onClick={() => handleDeleteProgress(entry.id)} className="text-sm text-red-600 hover:text-red-700">Xóa</button>
                        </div>
                      </div>
                      <p className="text-gray-700">{entry.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa ghi chú</h3>
            </div>
            <form onSubmit={handleUpdateProgress} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm (0–10)</label>
                <input type="number" min={0} max={10} step={0.1} value={editScore} onChange={(e) => setEditScore(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingEntry(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {analysisDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết phân tích</h3>
              <button onClick={() => setAnalysisDetail(null)} className="text-gray-500 hover:text-gray-700">Đóng</button>
            </div>
            <div className="p-6 space-y-4">
              {analysisDetailLoading ? (
                <div className="py-12 flex justify-center"><LoadingSpinner /></div>
              ) : (
                <>
                  {analysisDetail.image_url && (
                    <img src={analysisDetail.image_url} alt="Analysis" className="w-full h-60 object-cover rounded-xl" />
                  )}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-teal-600">{analysisDetail.skin_score}/10</div>
                      <div className="text-sm text-gray-600">Điểm tổng quan</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm text-gray-500">Loại da</div>
                      <div className="font-medium">{analysisDetail.analysis_data?.skinTypeVietnamese || analysisDetail.analysis_data?.skinType || '—'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm text-gray-500">Ngày</div>
                      <div className="font-medium">{new Date(analysisDetail.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  {analysisDetail.analysis_data?.analysis && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">✅ Điểm mạnh</h4>
                        <ul className="list-disc pl-5 text-gray-700">
                          {(analysisDetail.analysis_data.analysis.strengths || []).map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">⚠️ Cần cải thiện</h4>
                        <ul className="list-disc pl-5 text-gray-700">
                          {(analysisDetail.analysis_data.analysis.concerns || []).map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                      {analysisDetail.analysis_data.analysis.priority && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700">
                            <strong>Ưu tiên:</strong> {analysisDetail.analysis_data.analysis.priority}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;