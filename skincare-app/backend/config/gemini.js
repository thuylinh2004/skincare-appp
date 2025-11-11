import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from backend/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC2WndJMfsC0Vn5_Khnpes6ZPBCwlioL_M';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required in .env file');
}

// Initialize the Gemini API with the API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get the generative model
let model;
try {
  // Use an image-capable model (configurable via env)
  model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    },
  });
  console.log('✅ Gemini model initialized successfully');
  console.log('🧠 Gemini model:', GEMINI_MODEL);
} catch (error) {
  console.error('❌ Error initializing Gemini model:', error.message);
  throw error; // Re-throw to fail fast if model initialization fails
}

export { model as geminiModel, genAI };