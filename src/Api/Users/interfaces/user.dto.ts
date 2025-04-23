export interface CreateUserDTO {
  username: string;
  Contact: string;
  firstName: string;
  middleName?: string;
  surName: string;
  country: string;
  stateOfOrigin: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface GetUserById {
  id: string;
}

export interface UserModel {
  id: string;
  username: string;
  firstName: string;
  middleName?: string;
  surName: string;
  role: string;
  country: string;
  stateOfOrigin: string;
  phoneNumber: string;
  address: string;
  email: string;
  emailVerified: boolean;
  subActive: boolean;
  password: string;
  subActiveTill: Date;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}
