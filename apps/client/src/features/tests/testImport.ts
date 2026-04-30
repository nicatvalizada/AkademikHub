import type {
  ITestExportPayload,
  QuestionType,
  TestCreateInput,
} from "@akademik/shared";

export const IMPORT_MC_OPTION_COUNT = 5;

export type ImportedQuestionDraft = {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  points: number;
};

export type ImportedTestDraft = {
  title: string;
  description: string;
  source: TestCreateInput["source"];
  timeLimitMinutes?: number;
  pdfText?: string;
  questions: ImportedQuestionDraft[];
};

type MutableQuestionBlock = {
  promptLines: string[];
  options: string[];
  correctRaw?: string;
  points?: number;
};

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim();
}

function normalizeCompare(value: string): string {
  return value.trim().toLocaleLowerCase("az").replace(/\s+/g, " ");
}

function normalizeImportedText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/([^\n])\s*(\d+[.)]\s+)/g, "$1\n$2")
    .replace(/([^\n])\s*([A-E])[).](?=\s*\S)/g, "$1\n$2)")
    .replace(
      /([^\n])\s*((?:D[üu]zg[üu]n\s*cavab|Correct\s*answer)\s*:)/gi,
      "$1\n$2",
    )
    .replace(/([^\n])\s*((?:Xal|Points?)\s*:)/gi, "$1\n$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseOptionLine(line: string): RegExpMatchArray | null {
  return line.match(/^([A-E])[).:-]\s*(.+)$/i);
}

function parseAnswerLine(line: string): RegExpMatchArray | null {
  return line.match(
    /^(?:D[üu]zg[üu]n\s*cavab|Correct\s*answer)\s*:\s*(.+)$/i,
  );
}

function parsePointsLine(line: string): RegExpMatchArray | null {
  return line.match(/^(?:Xal|Points?)\s*:\s*(\d+)$/i);
}

function cleanOptionText(value: string): string {
  return value
    .replace(
      /\s*(?:D[üu]zg[üu]n\s*cavab|Correct\s*answer)\s*:.*$/i,
      "",
    )
    .replace(/\s*(?:Xal|Points?)\s*:\s*\d+.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCorrectIndex(
  raw: string | undefined,
  options: string[],
): number | undefined {
  if (!raw) return undefined;

  const trimmed = raw.trim();
  const letterMatch = trimmed.match(/^([A-E])$/i);
  if (letterMatch) {
    return letterMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  const oneBasedMatch = trimmed.match(/^(\d+)$/);
  if (oneBasedMatch) {
    const index = Number(oneBasedMatch[1]) - 1;
    return index >= 0 && index < options.length ? index : undefined;
  }

  const normalized = normalizeCompare(trimmed);
  const matchedIndex = options.findIndex(
    (option) => normalizeCompare(option) === normalized,
  );
  return matchedIndex >= 0 ? matchedIndex : undefined;
}

function isTrueFalseOptionSet(options: string[]): boolean {
  if (options.length !== 2) return false;
  const values = options.map((option) => normalizeCompare(option));
  const isTrue =
    values.includes("doğru") ||
    values.includes("dogru") ||
    values.includes("true");
  const isFalse =
    values.includes("yanlış") ||
    values.includes("yanlis") ||
    values.includes("false");
  return isTrue && isFalse;
}

function resolveTrueFalse(
  raw: string | undefined,
  options: string[],
): boolean | undefined {
  const index = resolveCorrectIndex(raw, options);
  if (index !== undefined) {
    return ["doğru", "dogru", "true"].includes(
      normalizeCompare(options[index] ?? ""),
    );
  }

  if (!raw) return undefined;
  const normalized = normalizeCompare(raw);
  if (["doğru", "dogru", "true"].includes(normalized)) return true;
  if (["yanlış", "yanlis", "false"].includes(normalized)) return false;
  return undefined;
}

function blockToDraft(
  block: MutableQuestionBlock,
): ImportedQuestionDraft | null {
  const prompt = block.promptLines.join(" ").replace(/\s+/g, " ").trim();
  if (!prompt) return null;

  const points =
    typeof block.points === "number" && Number.isFinite(block.points) && block.points > 0
      ? block.points
      : 1;
  const options = block.options.map(cleanOptionText).filter(Boolean);

  if (options.length >= 2) {
    if (isTrueFalseOptionSet(options)) {
      return {
        type: "true_false",
        prompt,
        options: [],
        correctBoolean: resolveTrueFalse(block.correctRaw, options) ?? true,
        points,
      };
    }

    return {
      type: "multiple_choice",
      prompt,
      options,
      correctIndex: resolveCorrectIndex(block.correctRaw, options) ?? 0,
      points,
    };
  }

  return {
    type: "short_answer",
    prompt,
    options: [],
    points,
  };
}

function parseQuestionDrafts(text: string): ImportedQuestionDraft[] {
  const normalizedText = normalizeImportedText(text);
  if (!normalizedText) return [];

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const drafts: ImportedQuestionDraft[] = [];
  let current: MutableQuestionBlock | null = null;

  const flushCurrent = () => {
    if (!current) return;
    const draft = blockToDraft(current);
    if (draft) drafts.push(draft);
    current = null;
  };

  for (const line of lines) {
    const numberedQuestion = line.match(/^(\d+)[.)]\s*(.+)$/);
    const optionLine = parseOptionLine(line);
    const answerLine = parseAnswerLine(line);
    const pointsLine = parsePointsLine(line);

    if (numberedQuestion) {
      flushCurrent();
      current = {
        promptLines: [numberedQuestion[2].trim()],
        options: [],
      };
      continue;
    }

    if (optionLine) {
      if (!current) current = { promptLines: [], options: [] };
      current.options.push(optionLine[2].trim());
      continue;
    }

    if (answerLine) {
      if (!current) current = { promptLines: [], options: [] };
      current.correctRaw = answerLine[1].trim();
      continue;
    }

    if (pointsLine) {
      if (!current) current = { promptLines: [], options: [] };
      current.points = Math.max(1, Number(pointsLine[1]) || 1);
      continue;
    }

    if (!current) {
      current = { promptLines: [line], options: [] };
      continue;
    }

    if (current.options.length === 0) {
      current.promptLines.push(line);
      continue;
    }

    if (current.correctRaw || current.points !== undefined) {
      flushCurrent();
      current = { promptLines: [line], options: [] };
      continue;
    }

    current.options[current.options.length - 1] =
      `${current.options[current.options.length - 1]} ${line}`.trim();
  }

  flushCurrent();
  return drafts;
}

function buildDraftMeta(
  fileName: string,
  source: ImportedTestDraft["source"],
  questions: ImportedQuestionDraft[],
  pdfText?: string,
): ImportedTestDraft {
  const questionCount = questions.length;
  const baseTitle = stripExtension(fileName) || "İdxal test";
  const description = questionCount
    ? `${questionCount} suallıq test fayldan avtomatik dolduruldu.`
    : "Fayldakı mətn oxundu, suallar avtomatik aşkarlanmadı.";

  return {
    title: baseTitle,
    description,
    source,
    timeLimitMinutes: questionCount || undefined,
    pdfText: pdfText?.trim() ? pdfText.trim() : undefined,
    questions,
  };
}

function normalizeJsonQuestion(
  question: unknown,
): ImportedQuestionDraft | null {
  if (!question || typeof question !== "object") return null;
  const raw = question as Partial<ITestExportPayload["questions"][number]>;

  if (typeof raw.prompt !== "string" || !raw.prompt.trim()) return null;
  const points =
    typeof raw.points === "number" && raw.points > 0 ? raw.points : 1;

  if (raw.type === "multiple_choice") {
    const options = Array.isArray(raw.options)
      ? raw.options.filter(
          (option): option is string =>
            typeof option === "string" && option.trim().length > 0,
        )
      : [];

    return {
      type: "multiple_choice",
      prompt: raw.prompt.trim(),
      options,
      correctIndex:
        typeof raw.correctIndex === "number" ? raw.correctIndex : 0,
      points,
    };
  }

  if (raw.type === "true_false") {
    return {
      type: "true_false",
      prompt: raw.prompt.trim(),
      options: [],
      correctBoolean:
        typeof raw.correctBoolean === "boolean" ? raw.correctBoolean : true,
      points,
    };
  }

  return {
    type: "short_answer",
    prompt: raw.prompt.trim(),
    options: [],
    points,
  };
}

export async function parseJsonTestFile(file: File): Promise<ImportedTestDraft> {
  const rawText = await file.text();
  const parsed = JSON.parse(rawText) as Partial<ITestExportPayload>;
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .map((question) => normalizeJsonQuestion(question))
        .filter((question): question is ImportedQuestionDraft => !!question)
    : [];

  if (!questions.length) {
    throw new Error("JSON faylında etibarlı sual tapılmadı.");
  }

  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : stripExtension(file.name) || "JSON test",
    description:
      typeof parsed.description === "string" && parsed.description.trim()
        ? parsed.description.trim()
        : `${questions.length} suallıq JSON import testi.`,
    source: "import_json",
    timeLimitMinutes: questions.length || undefined,
    questions,
  };
}

export function parsePdfTextToDraft(
  extractedText: string,
  fileName: string,
): ImportedTestDraft {
  const questions = parseQuestionDrafts(extractedText);
  return buildDraftMeta(fileName, "import_pdf", questions, extractedText);
}
