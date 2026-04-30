import mongoose, { Schema } from "mongoose";

export interface TestResultDoc {
  testId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  answers: Record<string, unknown>;
  durationSeconds?: number;
}

const testResultSchema = new Schema<TestResultDoc>(
  {
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    durationSeconds: { type: Number },
  },
  { timestamps: true },
);

export const TestResultModel = mongoose.model<TestResultDoc>("TestResult", testResultSchema);
