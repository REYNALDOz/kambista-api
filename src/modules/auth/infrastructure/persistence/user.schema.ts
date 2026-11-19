import { Schema } from 'mongoose';
import { Role, ROLES } from '../../domain/value-objects/role';

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'user' },
  },
  { timestamps: true },
);
