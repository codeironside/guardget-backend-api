import { Request, Response } from "express";
import { CreateUserDTO } from "../../interfaces/user.dto";
import { GetUserById } from "@/Api/Users/interfaces/user.dto";

export const getallUsers = async (req: Request<{} ,{},CreateUserDTO, GetUserById>, res: Response) => { 
    const name = req.body
    try { }
    catch (error) {
        
    }
}