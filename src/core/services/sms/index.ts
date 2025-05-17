import { config } from "@/core/utils/config";
import axios, { AxiosError } from "axios";
import { BadRequestError } from "@/core/error";

interface SendSMSPayload {
  to: string;
  text: string;
}

interface TermiiSMSResponse {
  message_id: string;
  balance: number;
  // Add other potential response fields
}

export class SMSService {
  private readonly baseUrl = "https://api.ng.termii.com/api/sms/send";
  private readonly headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  constructor() {
    this.validateConfig();
  }

  private validateConfig() {
    if (!config.TERMII_API_KEY || !config.TERMII_SENDER_ID) {
      throw new Error("Termii configuration incomplete");
    }
  }

  private async cleanPhoneNumber(phone: string): Promise<string> {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
      return `234${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith("234")) {
      return cleaned;
    }
    return `234${cleaned}`;
  }

  public async sendMessage(
    payload: SendSMSPayload
  ): Promise<TermiiSMSResponse> {
    try {
      console.log(`payload ${JSON.stringify(payload)}`)
      const formattedTo = await this.cleanPhoneNumber(payload.to);

      const requestBody = {
        to: formattedTo,
        sms: payload.text,
        from: config.TERMII_FROM,
        type: "plain",
        channel: "dnd",
        api_key: config.TERMII_API_KEY,
      };

      console.debug("Sending SMS request:", requestBody);

      const response = await axios.post<TermiiSMSResponse>(
        this.baseUrl,
        requestBody,
        { headers: this.headers }
      );

      console.log("SMS API response:", response.data);

      if (response.data.balance < 1) {
        throw new BadRequestError("Insufficient SMS credit");
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("SMS API Error:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        config: axiosError.config,
      });

      throw new BadRequestError(
        `SMS sending failed: ${this.getErrorMessage(axiosError)}`
      );
    }
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      return `[${error.response.status}] ${JSON.stringify(
        error.response.data
      )}`;
    }
    return error.message;
  }
}

export const smsService = new SMSService();
