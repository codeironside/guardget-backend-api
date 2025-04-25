import { config } from "@/core/utils/config";
import fetch from "node-fetch";
import { BadRequestError } from "@/core/error";

interface SendWhatsAppPayload {
    to: string;
    text: string;
}
interface TermiiResponse {
  message_id: string;
  api_response: string;
  status: string;
  [key: string]: any;
}

class WhatsAppService {
  private apiKey: string;
  private baseUrl: string;
  private deviceId: string;

  constructor() {
    this.apiKey = config.TERMII_API_KEY!;
    this.baseUrl = config.TERMII_BASE_URL!; 
    this.deviceId = config.TERMII_DEVICE_ID!; 

    if (!this.apiKey || !this.deviceId) {
      throw new Error("Termii API key or device ID not set in environment");
    }
  }

  
  public async sendMessage({
    to,
    text,
  }: SendWhatsAppPayload): Promise<TermiiResponse> {
    const url = `${this.baseUrl}/api/sms/send`; 
    const body = {
      to,
      from: this.deviceId,
      channel: "whatsapp",
      type: "plain",
      api_key: this.apiKey,
      sms: text,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  

    if (!res.ok) {
      const errorText = await res.text();
      throw new BadRequestError(`Termii API error: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as TermiiResponse;
    return data;
  }
}

export default new WhatsAppService();
