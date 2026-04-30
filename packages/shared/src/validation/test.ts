import { z } from "zod";

export const questionTypeSchema = z.enum(["multiple_choice", "true_false", "short_answer"]);

export const testSourceKindSchema = z.enum([
  "manual",
  "from_article",
  "import_json",
  "import_pdf",
  "ai_openai",
  "ai_gemini",
  "ai_deepseek",
  "ai_other",
]);

const questionBase = z.object({
  type: questionTypeSchema,
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  correctBoolean: z.boolean().optional(),
  points: z.number().positive().default(1),
});

export const questionDraftSchema = questionBase.superRefine((q, ctx) => {
  if (q.type === "multiple_choice") {
    if (!q.options || q.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Çoxseçimli sual üçün ən azı 2 variant lazımdır",
      });
    }
    if (q.correctIndex === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Düzgün variant indeksi tələb olunur",
      });
    } else if (q.options && q.correctIndex >= q.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctIndex variant siyahısından kənardadır",
      });
    }
  }
  if (q.type === "true_false" && q.correctBoolean === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Doğru/yalnış üçün correctBoolean tələb olunur",
    });
  }
});

export const testCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().max(2000).optional(),
  articleId: z.string().optional(),
  source: testSourceKindSchema,
  timeLimitMinutes: z.number().int().min(1).max(480).optional(),
  questions: z.array(questionDraftSchema).min(1, "Ən azı bir sual lazımdır"),
});

export const testUpdateSchema = testCreateSchema.partial();

export const testExportPayloadSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionDraftSchema),
});

export const testAiGenerateSchema = z
  .object({
    provider: z.enum(["openai", "gemini", "deepseek"]),
    articleId: z.string().optional(),
    text: z.string().min(20).optional(),
    questionCount: z.number().int().min(1).max(30).default(5),
  })
  .superRefine((v, ctx) => {
    if (!v.articleId && !v.text) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "articleId və ya text (mətn) göndərilməlidir",
        path: ["articleId"],
      });
    }
  });

export const testSubmitSchema = z.object({
  answers: z.record(z.unknown()),
  durationSeconds: z.number().int().min(1).max(24 * 60 * 60).optional(),
});

export type TestCreateInput = z.infer<typeof testCreateSchema>;
export type TestExportPayloadInput = z.infer<typeof testExportPayloadSchema>;
export type TestAiGenerateInput = z.infer<typeof testAiGenerateSchema>;
export type TestSubmitInput = z.infer<typeof testSubmitSchema>;
