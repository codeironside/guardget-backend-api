import * as crypto from 'crypto';

interface OTPGeneratorOptions {
  length?: number;
  algorithm?: string;
  encoding?: 'hex' | 'base32' | 'base64';
}
interface OTPinterface{ 
    generatedOtp: string;
}




export class OTPGenerator {
  static generate(
    length: number = 8,
    includeSpecialChars: boolean = false
  ): string {
    const numbers = "0123456789";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const specialChars = "!@#$%^&*";
    let charset = numbers + letters;
    if (includeSpecialChars) {
      charset += specialChars;
    }
    const randomBytes = crypto.randomBytes(length);
    const otpArray = new Array(length);
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      otpArray[i] = charset[randomIndex];
    }

    return otpArray.join("");
  }
}