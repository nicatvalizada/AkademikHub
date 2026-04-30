export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export type TestSourceKind =
  | "manual"
  | "from_article"
  | "import_json"
  | "import_pdf"
  | "ai_openai"
  | "ai_gemini"
  | "ai_deepseek"
  | "ai_other";

export interface IQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  points: number;
}

export interface ITest {
  id: string;
  title: string;
  description?: string;
  articleId?: string;
  source: TestSourceKind;
  timeLimitMinutes?: number;
  questions: IQuestion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  viewerProgress?: ITestViewerProgress;
}

export interface ITestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  maxScore: number;
  answers: Record<string, unknown>;
  completedAt: string;
  durationSeconds?: number;
}

export interface ITestViewerProgress {
  score: number;
  maxScore: number;
  percent: number;
  answeredCount: number;
  totalQuestions: number;
  completedAt: string;
  durationSeconds?: number;
}

export interface ITestQuestionStat {
  questionId: string;
  prompt: string;
  type: QuestionType;
  submissionCount: number;
  correctCount?: number;
  correctRate?: number;
}

export interface ITestStats {
  submissionCount: number;
  uniqueParticipantCount: number;
  averageScore: number;
  averagePercent: number;
  bestScore: number;
  maxPossibleScore: number;
  latestCompletionAt?: string;
  recentResults: Array<Pick<ITestResult, "id" | "score" | "maxScore" | "completedAt">>;
  questionStats: ITestQuestionStat[];
}

export interface ITestExportPayload {
  version: 1;
  title: string;
  description?: string;
  questions: Omit<IQuestion, "id">[];
}
