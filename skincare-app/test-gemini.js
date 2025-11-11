import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyC2WndJMfsC0Vn5_Khnpes6ZPBCwlioL_M';

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API test successful!');
    console.log('Response:', text);
  } catch (error) {
    console.error('Error testing Gemini API:');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGemini();
