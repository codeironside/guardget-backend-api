import { Request, Response } from "express";
import { User } from "../../model/users";
import { LoginUser } from "../../interfaces/user.dto";
import { BadRequestError } from "@/core/error";
import bycrypt from "bcrypt";
import CryptoService from "@/core/services/encryption";
import { Roles } from "../../model/roles/role";


export const loginUser = async (req: Request<{},{}, LoginUser>, res: Response): Promise<void> => { 
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestError("email and password are required");
        }
        const userExist = await User.findOne({ email });
        if (!userExist) {
            throw new BadRequestError("user does not exist");
        }
        const isPasswordValid = bycrypt.compareSync(password, userExist.password);
        if (!isPasswordValid) {
            throw new BadRequestError("invalid password");
        }
        const role = await Roles.findById(userExist.role);
        const token = await CryptoService.encryptId(userExist._id.toString());
        const user = {
            id: userExist._id,
            username: userExist.username,
            firstName: userExist.firstName,
            middleName: userExist.middleName,
            surName: userExist.surName,
            role: role?.name,
            accessToken: token,
            country: userExist.country,
            stateOfOrigin: userExist.stateOfOrigin,
            phoneNumber: userExist.phoneNumber,
            address: userExist.address,
            email: userExist.email,
            emailVerified: userExist.emailVerified,
            subActive: userExist.subActive,
            subActiveTill: userExist.subActiveTill,
        };
        res.status(201).json({
            status: "success",
            data:user
        })

    }catch(error){
        throw new BadRequestError("error logging you in");
    }
}