import type { QuestionType, TestSourceKind } from "@akademik/shared";
import mongoose, { Schema } from "mongoose";

export interface QuestionSub {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  points: number;
}

export interface TestDoc {
  title: string;
  description?: string;
  articleId?: mongoose.Types.ObjectId;
  source: TestSourceKind;
  timeLimitMinutes?: number;
  questions: QuestionSub[];
  createdBy: mongoose.Types.ObjectId;
}

const questionSchema = new Schema<QuestionSub>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer"],
      required: true,
    },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number },
    correctBoolean: { type: Boolean },
    points: { type: Number, required: true, default: 1 },
  },
  { _id: false },
);

const testSchema = new Schema<TestDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    articleId: { type: Schema.Types.ObjectId, ref: "Article", index: true },
    source: {
      type: String,
      enum: [
        "manual",
        "from_article",
        "import_json",
        "import_pdf",
        "ai_openai",
        "ai_gemini",
        "ai_deepseek",
        "ai_other",
      ],
      required: true,
    },
    timeLimitMinutes: { type: Number },
    questions: { type: [questionSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

export const TestModel = mongoose.model<TestDoc>("Test", testSchema);
