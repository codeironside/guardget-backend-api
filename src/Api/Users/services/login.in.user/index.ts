import { Request, Response } from "express";
import { User } from "../../model/users";
import { LoginUser } from "../../interfaces/user.dto";
import { BadRequestError } from "@/core/error";
import bycrypt from "bcrypt";
import CryptoService from "@/core/services/encryption";
import { Roles } from "../../model/roles/role";
import logger from "@/core/logger";


export const loginUser = async (req: Request<{},{}, LoginUser>, res: Response): Promise<void> => { 
    try {
        const { email, password } = req.body;
        console.log(`user details ${email}, password ${password}`)
        if (!email || !password) {
            throw new BadRequestError("email and password are required");
        }
        const userExist = await User.findOne({ email });

        console.log(`user details ${userExist}`);
        if (!userExist) {
            throw new BadRequestError("user does not exist");
        }
        if (userExist.Deactivated) {
            throw new BadRequestError(`Account doesnt exist on our platform`)
        }
        const isPasswordValid = bycrypt.compareSync(password, userExist.password);
        console.log(`password is valid ${isPasswordValid}`);
        if (!isPasswordValid) {
            throw new BadRequestError("invalid credentials");
        }
        const role = await Roles.findById(userExist.role);
        const token = await CryptoService.encryptId(userExist._id!.toString());
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
          keyholderPhone1: userExist.keyholderPhone1,
          keyholderPhone2: userExist.keyholderPhone2,
          email: userExist.email,
          imageurl: userExist.imageurl || "",
          emailVerified: userExist.emailVerified,
          subActive: userExist.subActive,
          subActiveTill: userExist.subActiveTill,
        };
        logger.info(`user with id ${userExist._id} logged in successfully`);
        res.status(201).json({
            status: "success",
            data:user
        })

    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        throw new BadRequestError("invalid credentials or user doesnt exist");
    }
}