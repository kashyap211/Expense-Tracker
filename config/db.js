import mongoose from 'mongoose';
import { config } from './env.js';


export default async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err);
    throw err;
  }
}
