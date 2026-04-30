import { z } from "zod";

export const userRoleSchema = z.enum(["student", "teacher", "researcher"]);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Şifrə ən azı 8 simvol olmalıdır"),
  name: z.string().min(2, "Ad ən azı 2 simvol olmalıdır"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Şifrə tələb olunur"),
});

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2, "Ad ən azı 2 simvol olmalıdır").max(80),
  profileColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Düzgün HEX rəng daxil edin"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
