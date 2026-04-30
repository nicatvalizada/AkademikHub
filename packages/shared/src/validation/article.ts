import { z } from "zod";

export const articleStatusSchema = z.enum(["draft", "published", "archived"]);
export const articleBookColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Düzgün HEX rəng daxil edin");

export const articleCreateSchema = z.object({
  title: z.string().min(2, "Başlıq ən azı 2 simvol olmalıdır"),
  content: z.string().min(1, "Məzmun boş ola bilməz"),
  status: articleStatusSchema.optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  link: z.string().url("Düzgün URL daxil edin").optional().or(z.literal("")),
  bookColor: articleBookColorSchema.optional(),
  bookAccentColor: articleBookColorSchema.optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial();

export const articleImportFromLinkSchema = z.object({
  url: z.string().url("Düzgün URL daxil edin"),
});

export const articleImportFromLinkResultSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  link: z.string().url(),
  tags: z.array(z.string().min(1).max(40)).max(20),
});

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
export type ArticleImportFromLinkInput = z.infer<typeof articleImportFromLinkSchema>;
export type ArticleImportFromLinkResult = z.infer<typeof articleImportFromLinkResultSchema>;
