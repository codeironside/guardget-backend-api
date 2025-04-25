import { Response, Request } from "express";
import { User } from "../../model/users";
import { BadRequestError } from "@/core/error";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import SMSService from "@/core/services/sms";
interface email {
  phoneNumber: string;
  password: string;
}

export const forgetPassword = async (
  req: Request<{}, {}, email>,
  res: Response
): Promise<void> => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      throw new BadRequestError("fields are required");
    }
    const userExist = await User.findOne({ phoneNumber });
    if (!userExist) {
      throw new BadRequestError("user not found");
    }

    const otp = await OTPGenerator.generate();
    const text = `welcome to guarget, this your OTP code ${otp}, please use it to verify your account, and do not disclose it.`;
    const to = phoneNumber;
    const sendOtp = await SMSService.sendMessage({ to, text });
    if (!sendOtp) {
      throw new BadRequestError("error sendind OTp");
    }
    req.session.user = {_id:userExist._id, otpCode: otp, password, changepassword: true };
    res.status(201).json({
      status: "success",
      message: "otp sent please check your phone",
    });
  } catch (error) {
    throw new BadRequestError("error ");
  }
};
