import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 3000
};
