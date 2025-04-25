import { Schema, model } from "mongoose";
import { RolesModel } from "../../interfaces/user.dto";


const RolesSchema = new Schema<RolesModel>({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
},{
    timestamps: true,
})

export const Roles  = model<RolesModel>("Roles", RolesSchema);