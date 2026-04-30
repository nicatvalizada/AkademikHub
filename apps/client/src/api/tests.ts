import type {
  ITest,
  ITestResult,
  ITestStats,
  QuestionType,
  TestCreateInput,
  TestAiGenerateInput,
} from "@akademik/shared";
import { api } from "./client";

type ApiOk<T> = { success: true; data: T };

export type AiGenerateResponse = {
  questions: Array<{
    type: QuestionType;
    prompt: string;
    options?: string[];
    correctIndex?: number;
    correctBoolean?: boolean;
    points: number;
  }>;
  suggestedSource: TestCreateInput["source"];
};

export async function fetchTests(): Promise<ITest[]> {
  const { data } = await api.get<ApiOk<ITest[]>>("/api/tests");
  return data.data;
}

export async function fetchTest(id: string): Promise<ITest> {
  const { data } = await api.get<ApiOk<ITest>>(`/api/tests/${id}`);
  return data.data;
}

export async function fetchTestStats(id: string): Promise<ITestStats> {
  const { data } = await api.get<ApiOk<ITestStats>>(`/api/tests/${id}/stats`);
  return data.data;
}

export async function createTest(body: TestCreateInput): Promise<ITest> {
  const { data } = await api.post<ApiOk<ITest>>("/api/tests", body);
  return data.data;
}

export async function updateTest(id: string, body: Partial<TestCreateInput>): Promise<ITest> {
  const { data } = await api.patch<ApiOk<ITest>>(`/api/tests/${id}`, body);
  return data.data;
}

export async function deleteTest(id: string): Promise<void> {
  await api.delete(`/api/tests/${id}`);
}

export async function submitTest(
  id: string,
  answers: Record<string, unknown>,
  durationSeconds?: number,
): Promise<ITestResult> {
  const { data } = await api.post<ApiOk<ITestResult>>(`/api/tests/${id}/submit`, {
    answers,
    durationSeconds,
  });
  return data.data;
}

export async function importTestJson(file: File): Promise<ITest> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<ApiOk<ITest>>("/api/tests/import/json", fd);
  return data.data;
}

export type PdfExtractResponse = { fileName: string; extractedText: string; charCount: number };

export async function extractPdfText(file: File): Promise<PdfExtractResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<ApiOk<PdfExtractResponse>>("/api/tests/import/pdf", fd);
  return data.data;
}

export type DocxExtractResponse = { fileName: string; extractedText: string; charCount: number };

export async function extractDocxText(file: File): Promise<DocxExtractResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<ApiOk<DocxExtractResponse>>("/api/tests/import/docx", fd);
  return data.data;
}

export async function generateTestQuestions(body: TestAiGenerateInput): Promise<AiGenerateResponse> {
  const { data } = await api.post<ApiOk<AiGenerateResponse>>("/api/tests/ai/generate", body);
  return data.data;
}

export async function downloadTestJson(id: string, fileName: string): Promise<void> {
  const res = await api.get(`/api/tests/${id}/export.json`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadTestPdf(id: string, fileName: string): Promise<void> {
  const res = await api.get(`/api/tests/${id}/export.pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
