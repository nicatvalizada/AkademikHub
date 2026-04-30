import {
  DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
  DEFAULT_ARTICLE_BOOK_COLOR,
  type ArticleStatus,
} from "@akademik/shared";
import mongoose, { Schema } from "mongoose";

export interface ArticleDoc {
  title: string;
  slug: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  status: ArticleStatus;
  tags: string[];
  link?: string;
  bookColor?: string;
  bookAccentColor?: string;
  deletedAt?: Date;
}

const articleSchema = new Schema<ArticleDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "draft",
    },
    tags: { type: [String], default: [] },
    link: { type: String, trim: true },
    bookColor: { type: String, trim: true, default: DEFAULT_ARTICLE_BOOK_COLOR },
    bookAccentColor: { type: String, trim: true, default: DEFAULT_ARTICLE_BOOK_ACCENT_COLOR },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

articleSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const ArticleModel = mongoose.model<ArticleDoc>("Article", articleSchema);
