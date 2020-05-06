import { Document } from "mongoose";

interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string | undefined;
  passwordConfirm?: string | undefined;
  passwordChangedAt?: any;
  passwordResetToken?: any;
  passwordResetExpires?: any;
  active?: boolean;
  position: string;
  status: string;
  seniority: number;
  hireDate: Date;
  preferredShiftSlots: string[];

  correctPassword(password: string, passwordConfirm: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): Promise<boolean>;
  createPasswordResetToken(): string;
}

export default IEmployee;