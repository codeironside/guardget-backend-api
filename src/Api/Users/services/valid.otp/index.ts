import { User } from '@/Api/Users/model/users';
import { BadRequestError } from '@/core/error';
import { Response,Request } from 'express';
import { OTP } from '../../interfaces/user.dto';



export const validateOtp = async (req: Request<{},{}, OTP>, res: Response): Promise<void> => {
    try {
        const { otp } = req.body;
        if (!otp&& otp.length < 8) {
            throw new BadRequestError("OTP is required");
        }
        if (req.session.user?.otpCode !== otp) {
            throw new BadRequestError("Invalid OTP");

        }
    
    } catch (error) {
        throw new BadRequestError("Error validating OTP");
    }
}