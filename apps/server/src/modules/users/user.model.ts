import {
  DEFAULT_USER_PROFILE_COLOR,
  type UserRole,
} from "@akademik/shared";
import mongoose, { Schema } from "mongoose";

export interface UserDoc {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  profileColor?: string;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    profileColor: { type: String, trim: true, default: DEFAULT_USER_PROFILE_COLOR },
    role: {
      type: String,
      enum: ["student", "teacher", "researcher"],
      required: true,
    },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<UserDoc>("User", userSchema);
