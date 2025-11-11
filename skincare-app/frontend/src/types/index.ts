export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  skinType: 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';
  skinConcerns: string[];
  age: number;
  createdAt: string;
}

export interface SkinAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  analysis: {
    skinType: string;
    acneLevel: number;
    wrinkleLevel: number;
    pigmentationLevel: number;
    poreSize: number;
    oiliness: number;
    hydrationLevel: number;
  };
  recommendations: ProductRecommendation[];
  createdAt: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment';
  price: number;
  rating: number;
  imageUrl: string;
  description: string;
  ingredients: string[];
}

export interface SkincareRoutine {
  id: string;
  userId: string;
  name: string;
  timeOfDay: 'morning' | 'evening';
  steps: RoutineStep[];
  active: boolean;
  createdAt: string;
}

export interface RoutineStep {
  id: string;
  productId: string;
  productName: string;
  order: number;
  instructions: string;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  imageUrl: string;
  notes: string;
  skinScore: number;
  createdAt: string;
}