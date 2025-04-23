// src/core/utls/config/index.ts

// Export the interface
interface Config {
  PORT: number;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  OTP_EXPIRY_MINUTES: number;
  NODE_ENV: string;
  MONGO_URI: string;
  ID_ENC_SECRET: string;
}

// Export the concrete implementation
export const config: Config = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  EMAIL_HOST: process.env.EMAIL_HOST || "",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
  ID_ENC_SECRET: process.env.ID_ENC_SECRET || "",
};
