import { config } from "@/core/utils/config";
import fetch from "node-fetch";
import { BadRequestError } from "@/core/error";
import rateLimit from "express-rate-limit";
import axios from "axios";

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
    this.from = config.TERMII_FROM!;
    if (!this.apiKey || !this.senderId) {
      throw new Error("Termii API key or sender ID not configured");
    }
  }
  private async cleanPhoneNumber(to: string) {
    let cleaned = to.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      return "234" + cleaned.substring(1);
    }
    if (cleaned.startsWith("2340")) {
      return "234" + cleaned.substring(4);
    }
    return cleaned;
  }

  //   public async sendMessage({
  //     to,
  //     text
  //   }: SendSMSPayload): Promise<TermiiSMSResponse> {
  //     const url = `${this.baseUrl}/api/sms/send`;

  //     const body = {
  //       to: await this.cleanPhoneNumber(to),
  //       sms: text,
  //       from: this.from,
  //       api_key: this.apiKey,
  //       type: this.smsType,
  //       channel: this.channel,
  //     };
  //  console.log(
  //    `Termii API ${JSON.stringify(body)} `
  //  );
  // await axios.post(url, JSON.stringify(body));

  //     const response = await fetch(url, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(body),
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new BadRequestError(
  //         `SMS API error: ${response.status} ${errorText}`
  //       );
  //     }

  //     const data = (await response.json()) as TermiiSMSResponse;

  //     if (data.balance < 1) {
  //       throw new BadRequestError("Insufficient SMS credit");
  //     }

  //     return data;
  //   }
  public async sendMessage({
    to,
    text,
  }: SendSMSPayload): Promise<TermiiSMSResponse> {
    const url = `${this.baseUrl}/api/sms/send`;

    const body = {
      to: await this.cleanPhoneNumber(to),
      sms: text,
      from: this.from,
      api_key: this.apiKey,
      type: this.smsType,
      channel: this.channel,
    };

    console.log(`Sending SMS with body:`, body);
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    

    if (response.data.balance < 1) {
      throw new BadRequestError("Insufficient SMS credit");
    }
    if (response.status !== 200) {
      throw new BadRequestError(
        `SMS API error: ${response.status} ${response.data}`
      );
    }

    return response.data;
  }
}

export default new SMSService();
