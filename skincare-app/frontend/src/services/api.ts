const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
import { supabase } from '../config/supabase';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Supabase access token if available
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (accessToken) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Analysis endpoints
  async analyzeImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Include Supabase access token if available
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    console.log('Sending request to:', `${API_BASE_URL}/analysis/analyze`);
    const response = await fetch(`${API_BASE_URL}/analysis/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      console.error('Error response:', error);
      throw new Error(error.message || 'Analysis failed');
    }

    return response.json();
  }

  async getAnalysisHistory() {
    const res = await this.request('/analysis/history');
    return res?.data ?? res;
  }

  async getAnalysisById(id: string) {
    const res = await this.request(`/analysis/${id}`);
    return res?.data ?? res;
  }

  // Profile endpoints
  async getProfile() {
    const res = await this.request('/profile');
    return res?.data ?? res; // unwrap { success, data }
  }

  async updateProfile(profileData: any) {
    const res = await this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return res?.data ?? res;
  }

  async getProfileStats() {
    const res = await this.request('/profile/stats');
    return res?.data ?? res;
  }

  // Routines endpoints
  async getRoutines() {
    const res = await this.request('/routines');
    return res?.data ?? res;
  }

  async createRoutine(routineData: any) {
    const res = await this.request('/routines', {
      method: 'POST',
      body: JSON.stringify(routineData),
    });
    return res?.data ?? res;
  }

  async updateRoutine(id: string, routineData: any) {
    const res = await this.request(`/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routineData),
    });
    return res?.data ?? res;
  }

  async deleteRoutine(id: string) {
    const res = await this.request(`/routines/${id}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  }

  async generateAIRoutines() {
    const res = await this.request('/routines/ai-generate', {
      method: 'POST',
    });
    return res?.data ?? res;
  }

  // Progress endpoints
  async getProgressEntries() {
    const res = await this.request('/progress');
    return res?.data ?? res;
  }

  async createProgressEntry(entryData: any) {
    const res = await this.request('/progress', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return res?.data ?? res;
  }

  async updateProgressEntry(id: string, entryData: any) {
    const res = await this.request(`/progress/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    return res?.data ?? res;
  }

  async deleteProgressEntry(id: string) {
    const res = await this.request(`/progress/${id}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  }

  // Products endpoints
  async getProducts(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    return this.request(`/products${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProductById(id: string) {
    return this.request(`/products/${id}`);
  }

  async searchProducts(query: string) {
    return this.request(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async productChat(message: string) {
    const res = await this.request('/products/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return res?.data ?? res; // { reply }
  }

  async searchExternalProducts(q: string, skinType?: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (skinType) params.set('skinType', skinType);
    const res = await this.request(`/products/external-search?${params.toString()}`);
    return res?.data ?? res;
  }

  // Recommendations endpoints
  async getRecommendations(analysisId: string) {
    return this.request(`/analysis/${analysisId}/recommendations`);
  }
}

export const apiService = new ApiService();