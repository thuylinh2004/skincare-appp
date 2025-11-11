// @ts-check
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC2WndJMfsC0Vn5_Khnpes6ZPBCwlioL_M';

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

async function testGemini() {
  try {
    console.log('🔍 Testing Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Test image analysis with current configured model
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    console.log(`\n🖼️ Testing image analysis with model: ${modelName}`);
    const visionModel = genAI.getGenerativeModel({ model: modelName });
    
    // A simple 1x1 transparent pixel as base64
    const testImage = {
      inlineData: {
        mimeType: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      },
    };
    
    const imageResult = await visionModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'What is in this image?' },
            testImage,
          ],
        },
      ],
    });
    
    const imageResponse = await imageResult.response;
    console.log('✅ Image analysis successful!');
    console.log('Analysis:', imageResponse.text());
    
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('\nResponse status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack.split('\n').slice(0, 5).join('\n') + '\n...');
    }
  }
}

// Run the test
testGemini();
