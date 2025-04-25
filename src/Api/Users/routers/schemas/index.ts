import { checkSchema } from "express-validator";

export const userValidationSchema = checkSchema({
  userName: {
    in: ["body"],
    isLength: {
      options: { min: 3, max: 30 },
      errorMessage: "Username must be between 3 and 30 characters long",
    },
    matches: {
      options: [/^[a-zA-Z0-9_]+$/],
      errorMessage:
        "Username can only contain letters, numbers, and underscores",
    },
    trim: true,
    escape: true,
  },
  firstName: {
    in: ["body"],
    isAlpha: {
      errorMessage: "First name must contain only letters",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "First name is required",
    },
    trim: true,
    escape: true,
  },
  middleName: {
    in: ["body"],
    optional: true,
    isAlpha: {
      errorMessage: "Middle name must contain only letters",
    },
    trim: true,
    escape: true,
  },
  surName: {
    in: ["body"],
    isAlpha: {
      errorMessage: "Surname must contain only letters",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "Surname is required",
    },
    trim: true,
    escape: true,
  },
  role: {
    in: ["body"],
    isIn: {
      options: [["customer", "admin", "moderator"]],
      errorMessage: "Role must be one of: customer, admin, moderator",
    },
    trim: true,
    escape: true,
  },
  country: {
    in: ["body"],
    isAlpha: {
      errorMessage: "Country must contain only letters",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "Country is required",
    },
    trim: true,
    escape: true,
  },
  stateOfOrigin: {
    in: ["body"],
    isAlpha: {
      errorMessage: "State of origin must contain only letters",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "State of origin is required",
    },
    trim: true,
    escape: true,
  },
  phoneNumber: {
    in: ["body"],
    matches: {
      options: [/^\+234[0-9]{10}$/],
      errorMessage:
        "Phone number must be a valid Nigerian number starting with +234 followed by 10 digits",
    },
    trim: true,
  },
  address: {
    in: ["body"],
    isLength: {
      options: { min: 5 },
      errorMessage: "Address must be at least 5 characters long",
    },
    trim: true,
    escape: true,
  },
  email: {
    in: ["body"],
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  password: {
    in: ["body"],
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      },
      errorMessage:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol",
    },
  },
});
