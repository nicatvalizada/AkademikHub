import type {
  IQuestion,
  ITest,
  ITestResult,
  ITestStats,
  TestCreateInput,
  TestExportPayloadInput,
  TestSubmitInput,
} from "@akademik/shared";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import * as articleSvc from "../articles/article.service.js";
import type { QuestionSub, TestDoc } from "./test.model.js";
import { TestModel } from "./test.model.js";
import { TestResultModel } from "./testResult.model.js";
import { UserModel } from "../users/user.model.js";

function assignQuestionIds(questions: Omit<IQuestion, "id">[]): QuestionSub[] {
  return questions.map((q) => ({
    id: randomUUID(),
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    correctBoolean: q.correctBoolean,
    points: q.points,
  }));
}

function toQuestionPublic(q: QuestionSub, revealAnswers: boolean): IQuestion {
  if (revealAnswers) {
    return {
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      correctBoolean: q.correctBoolean,
      points: q.points,
    };
  }
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    points: q.points,
  };
}

function toTestPublic(
  doc: TestDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date },
  revealAnswers: boolean,
  viewerProgress?: ITest["viewerProgress"],
): ITest {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    articleId: doc.articleId ? String(doc.articleId) : undefined,
    source: doc.source,
    timeLimitMinutes: doc.timeLimitMinutes,
    questions: doc.questions.map((q) => toQuestionPublic(q, revealAnswers)),
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
    viewerProgress,
  };
}

function countAnsweredQuestions(answers: Record<string, unknown> | undefined): number {
  if (!answers) return 0;
  return Object.values(answers).filter((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }).length;
}

function toViewerProgress(
  result: {
    score: number;
    maxScore: number;
    answers?: Record<string, unknown>;
    durationSeconds?: number;
    createdAt?: Date;
  },
  totalQuestions: number,
): NonNullable<ITest["viewerProgress"]> {
  return {
    score: result.score,
    maxScore: result.maxScore,
    percent: result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0,
    answeredCount: countAnsweredQuestions(result.answers),
    totalQuestions,
    completedAt: result.createdAt?.toISOString() ?? new Date().toISOString(),
    durationSeconds: result.durationSeconds,
  };
}

export async function listTests(viewerId: string, viewerRole: string): Promise<ITest[]> {
  const query: any = {};

  if (viewerRole === "student") {
    const staff = await UserModel.find({ role: { $in: ["teacher", "researcher"] } }, "_id").lean();
    const staffIds = staff.map(s => s._id);
    query.createdBy = { $in: [...staffIds, new mongoose.Types.ObjectId(viewerId)] };
  }

  const rows = await TestModel.find(query).sort({ updatedAt: -1 }).lean();
  const testIds = rows.map((row) => row._id);
  const latestResults = testIds.length
    ? await TestResultModel.find({
        userId: new mongoose.Types.ObjectId(viewerId),
        testId: { $in: testIds },
      })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const latestByTestId = new Map<string, (typeof latestResults)[number]>();
  for (const result of latestResults) {
    const key = String(result.testId);
    if (!latestByTestId.has(key)) {
      latestByTestId.set(key, result);
    }
  }

  return rows.map((r) => {
    const doc = r as TestDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date };
    const latest = latestByTestId.get(String(doc._id));
    return toTestPublic(
      doc,
      false,
      latest ? toViewerProgress(latest, doc.questions.length) : undefined,
    );
  });
}

export async function getTestForViewer(
  id: string,
  userId: string,
  role: string,
): Promise<ITest | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await TestModel.findById(id).lean();
  if (!row) return null;
  const doc = row as TestDoc & { _id: unknown };
  const isCreator = String(doc.createdBy) === userId;
  const reveal = isCreator || role === "researcher";
  return toTestPublic(doc, reveal);
}

export async function createTest(userId: string, input: TestCreateInput): Promise<ITest> {
  let articleOid: mongoose.Types.ObjectId | undefined;
  if (input.articleId) {
    if (!mongoose.Types.ObjectId.isValid(input.articleId)) {
      throw new Error("INVALID_ARTICLE");
    }
    articleOid = new mongoose.Types.ObjectId(input.articleId);
  }
  const questions = assignQuestionIds(input.questions);
  const doc = await TestModel.create({
    title: input.title,
    description: input.description,
    articleId: articleOid,
    source: input.source,
    timeLimitMinutes: input.timeLimitMinutes,
    questions,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  return toTestPublic(doc.toObject() as TestDoc & { _id: unknown }, true);
}

export async function updateTest(
  id: string,
  userId: string,
  patch: Partial<TestCreateInput>,
): Promise<ITest | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const existing = await TestModel.findById(id).lean();
  if (!existing) return null;
  if (String(existing.createdBy) !== userId) return null;

  const set: Record<string, unknown> = {};
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.timeLimitMinutes !== undefined) set.timeLimitMinutes = patch.timeLimitMinutes;
  if (patch.source !== undefined) set.source = patch.source;
  if (patch.articleId !== undefined) {
    if (patch.articleId === "") {
      set.articleId = undefined;
    } else if (mongoose.Types.ObjectId.isValid(patch.articleId)) {
      set.articleId = new mongoose.Types.ObjectId(patch.articleId);
    }
  }
  if (patch.questions !== undefined) {
    set.questions = assignQuestionIds(patch.questions);
  }

  const row = await TestModel.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
  if (!row) return null;
  return toTestPublic(row as TestDoc & { _id: unknown }, true);
}

export async function deleteTest(id: string, userId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await TestModel.deleteOne({
    _id: id,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  return res.deletedCount === 1;
}

export async function getTestFull(id: string): Promise<ITest | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await TestModel.findById(id).lean();
  if (!row) return null;
  return toTestPublic(row as TestDoc & { _id: unknown }, true);
}

export function buildExportPayload(test: ITest): TestExportPayloadInput {
  return {
    version: 1,
    title: test.title,
    description: test.description,
    questions: test.questions.map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      correctBoolean: q.correctBoolean,
      points: q.points,
    })),
  };
}

export async function submitTest(
  testId: string,
  userId: string,
  body: TestSubmitInput,
): Promise<ITestResult> {
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new Error("NOT_FOUND");
  }
  const row = await TestModel.findById(testId).lean();
  if (!row) throw new Error("NOT_FOUND");
  const doc = row as TestDoc & { _id: unknown };

  let score = 0;
  let maxScore = 0;
  const answers = body.answers;

  for (const q of doc.questions) {
    maxScore += q.points;
    const a = answers[q.id];
    if (q.type === "multiple_choice" && typeof a === "number" && q.correctIndex === a) {
      score += q.points;
    } else if (q.type === "true_false" && typeof a === "boolean" && q.correctBoolean === a) {
      score += q.points;
    }
  }

  const tr = await TestResultModel.create({
    testId: new mongoose.Types.ObjectId(testId),
    userId: new mongoose.Types.ObjectId(userId),
    score,
    maxScore,
    answers,
    durationSeconds: body.durationSeconds,
  });

  const o = tr.toObject() as { _id: unknown; createdAt?: Date; durationSeconds?: number };
  return {
    id: String(o._id),
    testId,
    userId,
    score,
    maxScore,
    answers,
    completedAt: (o as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    durationSeconds: o.durationSeconds,
  };
}

export async function createFromImport(
  userId: string,
  payload: TestExportPayloadInput,
  source: ITest["source"],
): Promise<ITest> {
  return createTest(userId, {
    title: payload.title,
    description: payload.description,
    source,
    questions: payload.questions,
  });
}

export async function resolveTextForAi(
  articleId: string | undefined,
  text: string | undefined,
  userId: string,
  role: string,
): Promise<string> {
  if (text) return text;
  if (!articleId) throw new Error("NO_SOURCE");
  const a = await articleSvc.getArticleContentForUser(articleId, userId, role);
  if (!a) throw new Error("ARTICLE_NOT_FOUND");
  return `${a.title}\n\n${a.content}`;
}

export async function getTestStats(
  id: string,
  userId: string,
  role: string,
): Promise<ITestStats | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const row = await TestModel.findById(id).lean();
  if (!row) return null;

  const doc = row as TestDoc & { _id: unknown };
  const isCreator = String(doc.createdBy) === userId;
  if (!isCreator && role !== "researcher") return null;

  const results = await TestResultModel.find({ testId: new mongoose.Types.ObjectId(id) })
    .sort({ createdAt: -1 })
    .lean();

  const maxPossibleScore = doc.questions.reduce((sum, question) => sum + question.points, 0);
  const submissionCount = results.length;
  const uniqueParticipantCount = new Set(results.map((result) => String(result.userId))).size;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averageScore = submissionCount ? Number((totalScore / submissionCount).toFixed(2)) : 0;
  const averagePercent = submissionCount
    ? Number(
        (
          results.reduce((sum, result) => sum + (result.maxScore ? (result.score / result.maxScore) * 100 : 0), 0) /
          submissionCount
        ).toFixed(2),
      )
    : 0;
  const bestScore = results.reduce((max, result) => Math.max(max, result.score), 0);
  const latestCompletionAt = results[0]
    ? (results[0] as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString()
    : undefined;

  return {
    submissionCount,
    uniqueParticipantCount,
    averageScore,
    averagePercent,
    bestScore,
    maxPossibleScore,
    latestCompletionAt,
    recentResults: results.slice(0, 5).map((result) => ({
      id: String(result._id),
      score: result.score,
      maxScore: result.maxScore,
      completedAt: (result as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    })),
    questionStats: doc.questions.map((question) => {
      const questionAnswers = results.filter((result) => result.answers && question.id in result.answers);
      const submissionCountForQuestion = questionAnswers.length;

      if (question.type === "multiple_choice") {
        const correctCount = questionAnswers.filter((result) => result.answers?.[question.id] === question.correctIndex).length;
        return {
          questionId: question.id,
          prompt: question.prompt,
          type: question.type,
          submissionCount: submissionCountForQuestion,
          correctCount,
          correctRate: submissionCountForQuestion
            ? Number(((correctCount / submissionCountForQuestion) * 100).toFixed(1))
            : 0,
        };
      }

      if (question.type === "true_false") {
        const correctCount = questionAnswers.filter((result) => result.answers?.[question.id] === question.correctBoolean).length;
        return {
          questionId: question.id,
          prompt: question.prompt,
          type: question.type,
          submissionCount: submissionCountForQuestion,
          correctCount,
          correctRate: submissionCountForQuestion
            ? Number(((correctCount / submissionCountForQuestion) * 100).toFixed(1))
            : 0,
        };
      }

      return {
        questionId: question.id,
        prompt: question.prompt,
        type: question.type,
        submissionCount: submissionCountForQuestion,
      };
    }),
  };
}
