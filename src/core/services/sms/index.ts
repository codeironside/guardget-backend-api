
import { config } from "@/core/utils/config";
import fetch from "node-fetch";
import { BadRequestError } from "@/core/error";
import rateLimit from "express-rate-limit";

interface SendSMSPayload {
  to: string;
  text: string;
}

interface TermiiSMSResponse {
  message_id: string;
  balance: number;
  user: string;
  [key: string]: any;
}

export const smsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many SMS requests from this IP, please try again later",
});

class SMSService {
  private apiKey: string;
  private baseUrl: string;
  private senderId: string;
  private channel: string;
  private smsType: string;
  private from: string;

  constructor() {
    this.apiKey = config.TERMII_API_KEY!;
    this.baseUrl = config.TERMII_BASE_URL!;
    this.channel = config.TERMII_CHANNEL!;
    this.smsType = config.TERMII_SMS_TYPE!;
    this.senderId = config.TERMII_SENDER_ID!;
    this.from = config.TERMII_FROM!
    if (!this.apiKey || !this.senderId) {
      throw new Error("Termii API key or sender ID not configured");
    }
  }
  private async cleanPhoneNumber(to:string) {
  if (to.startsWith("2340")) {
    return "234" + to.slice(4); // Remove the '0' after '234'
  }
  return to; // Leave unchanged if there's no '0'
}

  public async sendMessage({
    to,
    text
  }: SendSMSPayload): Promise<TermiiSMSResponse> {
    const url = `${this.baseUrl}/api/sms/send`;

    const body = {
      to: this.cleanPhoneNumber(to),
      sms: text,
      from: this.from,
      api_key: this.apiKey,
      type: this.smsType,
      channel: this.channel,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(
        `SMS API error: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as TermiiSMSResponse;

    if (data.balance < 1) {
      throw new BadRequestError("Insufficient SMS credit");
    }

    return data;
  }
}

export default new SMSService();