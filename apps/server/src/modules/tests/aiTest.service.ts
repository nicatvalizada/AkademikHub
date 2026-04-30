import { questionDraftSchema } from "@akademik/shared";
import { z } from "zod";
import { env } from "../../config/env.js";

const aiResponseSchema = z.object({
  questions: z.array(questionDraftSchema),
});

const SYSTEM_PROMPT = `You are an assistant that creates quiz questions from an article or study text.
Return ONLY valid JSON with shape: {"questions":[...]}.
Each question must use type "multiple_choice" (4 options, correctIndex 0-3) or "true_false" (correctBoolean).
Write the questions in clear Azerbaijani.
Use only the provided source text. Do not invent facts.
Every question needs "points" (number, typically 1).`;

function buildUserPrompt(sourceText: string, questionCount: number): string {
  return `Bu məqalədən istifadə edərək tam olaraq ${questionCount} test sualı hazırla.
- Suallar mətnə əsaslansın
- Mümkün olduqda əsas anlayışları və vacib detalları yoxlasın
- Cavabı yalnız JSON qaytar

Məqalə mətni:
---
${sourceText.slice(0, 12000)}
---`;
}

type OpenAiCompatibleProvider = {
  apiLabel: string;
  missingKeyMessage: string;
  apiKey?: string;
  model: string;
  baseUrl: string;
};

async function callOpenAiCompatible(
  provider: OpenAiCompatibleProvider,
  sourceText: string,
  questionCount: number,
): Promise<z.infer<typeof aiResponseSchema>> {
  const key = provider.apiKey;
  if (!key) {
    throw new Error(provider.missingKeyMessage);
  }
  const res = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.35,
      max_tokens: 4000,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(sourceText, questionCount) },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${provider.apiLabel} xətası: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error(`${provider.apiLabel} boş cavab qaytardı`);
  const parsed = JSON.parse(raw) as unknown;
  return aiResponseSchema.parse(parsed);
}

async function callOpenAI(sourceText: string, questionCount: number): Promise<z.infer<typeof aiResponseSchema>> {
  return callOpenAiCompatible(
    {
      apiLabel: "OpenAI",
      missingKeyMessage: "OPENAI_API_KEY təyin edilməyib",
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      baseUrl: "https://api.openai.com/v1",
    },
    sourceText,
    questionCount,
  );
}

async function callGemini(sourceText: string, questionCount: number): Promise<z.infer<typeof aiResponseSchema>> {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY təyin edilməyib");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(sourceText, questionCount) }],
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini xətası: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini boş cavab qaytardı");
  const parsed = JSON.parse(raw) as unknown;
  return aiResponseSchema.parse(parsed);
}

async function callDeepSeek(sourceText: string, questionCount: number): Promise<z.infer<typeof aiResponseSchema>> {
  return callOpenAiCompatible(
    {
      apiLabel: "DeepSeek",
      missingKeyMessage: "DEEPSEEK_API_KEY təyin edilməyib",
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL,
      baseUrl: "https://api.deepseek.com/v1",
    },
    sourceText,
    questionCount,
  );
}

export async function generateQuestionsFromText(
  provider: "openai" | "gemini" | "deepseek",
  sourceText: string,
  questionCount: number,
): Promise<z.infer<typeof aiResponseSchema>["questions"]> {
  const out =
    provider === "openai"
      ? await callOpenAI(sourceText, questionCount)
      : provider === "gemini"
        ? await callGemini(sourceText, questionCount)
        : await callDeepSeek(sourceText, questionCount);
  return out.questions;
}
