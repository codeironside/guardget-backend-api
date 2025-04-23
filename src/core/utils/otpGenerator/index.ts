import * as crypto from 'crypto';

interface OTPGeneratorOptions {
  length?: number;
  algorithm?: string;
  encoding?: 'hex' | 'base32' | 'base64';
}
interface OTPinterface{ 
    generatedOtp: string;
}


export class OTPGenerator{
    static generate(): string {
        const otpLength = 8;
        const max = 10 ** otpLength;
        const otp = crypto.randomInt(0, max)
    return otp.toString().padStart(otpLength, '0');
        
    }
}