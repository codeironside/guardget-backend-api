import {Logger} from "../../../logger/index";
import { AppError } from "../../../error/Apperrors/index";
import { BadRequestError as BRE } from "../../../error/index";
import{ Config } from "../../config/index";
import { Whatsapp } from "../../../services/whatsapp/index";


declare global {
var logger: typeof Logger;
  var BadRequestError: typeof BRE;
  var config: typeof Config;
  var whatsapp: typeof Whatsapp;
}

export {};
