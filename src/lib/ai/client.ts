import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Groq (Primary Brain - Llama 3.1 70B)
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Initialize Gemini (Speed Reader - Gemini 1.5 Flash)
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
