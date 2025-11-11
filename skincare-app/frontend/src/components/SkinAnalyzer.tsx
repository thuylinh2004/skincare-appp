import React, { useState } from 'react';
import { apiService } from '../services/api';

type AnalysisResult = {
  success: boolean;
  message?: string;
  [key: string]: any;
};

const SkinAnalyzer: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0] || null;
    setImage(file);
    setResult(null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const onAnalyze = async () => {
    if (!image) {
      setError('Vui lòng chọn một ảnh trước.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.analyzeImage(image);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Phân Tích Da</h2>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />

        {preview && (
          <div className="flex items-center space-x-4">
            <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
            <button
              onClick={onAnalyze}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Đang phân tích...' : 'Phân tích ảnh'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
            <div className="text-green-700 font-medium">Kết quả:</div>
            <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkinAnalyzer;