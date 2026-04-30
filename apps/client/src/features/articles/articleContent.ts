const INLINE_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function renderInline(text: string) {
  const linkPlaceholders: string[] = [];
  let html = escapeHtml(text).replace(
    INLINE_LINK_PATTERN,
    (_match, label: string, href: string) => {
      const token = `@@ARTICLELINK${linkPlaceholders.length}@@`;
      linkPlaceholders.push(
        `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`,
      );
      return token;
    },
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  return html.replace(/@@ARTICLELINK(\d+)@@/g, (_match, index: string) => linkPlaceholders[Number(index)] ?? "");
}

function flushParagraph(blocks: string[], lines: string[]) {
  if (!lines.length) return;
  blocks.push(`<p>${lines.map((line) => renderInline(line)).join("<br />")}</p>`);
  lines.length = 0;
}

function flushList(blocks: string[], listType: "ul" | "ol" | null, items: string[]) {
  if (!listType || !items.length) return;
  blocks.push(
    `<${listType}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${listType}>`,
  );
  items.length = 0;
}

function flushQuote(blocks: string[], lines: string[]) {
  if (!lines.length) return;
  blocks.push(`<blockquote>${lines.map((line) => renderInline(line)).join("<br />")}</blockquote>`);
  lines.length = 0;
}

export function renderArticleContent(content: string) {
  const source = content.replace(/\r\n/g, "\n").trim();
  if (!source) return "<p></p>";

  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  const quoteLines: string[] = [];
  const listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushAll = () => {
    flushParagraph(blocks, paragraphLines);
    flushQuote(blocks, quoteLines);
    flushList(blocks, listType, listItems);
    listType = null;
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushAll();
      blocks.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushAll();
      blocks.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listType, listItems);
      listType = null;
      quoteLines.push(trimmed.slice(2));
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph(blocks, paragraphLines);
      flushQuote(blocks, quoteLines);
      if (listType && listType !== "ul") {
        flushList(blocks, listType, listItems);
      }
      listType = "ul";
      listItems.push(trimmed.slice(2));
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph(blocks, paragraphLines);
      flushQuote(blocks, quoteLines);
      if (listType && listType !== "ol") {
        flushList(blocks, listType, listItems);
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushQuote(blocks, quoteLines);
    flushList(blocks, listType, listItems);
    listType = null;
    paragraphLines.push(trimmed);
  }

  flushAll();
  return blocks.join("");
}

export function stripArticleContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(INLINE_LINK_PATTERN, "$1")
    .replace(/^#{2,3}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type SelectionTransformResult = {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
};

export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after = before,
  fallback = "",
): SelectionTransformResult {
  const selectedText = value.slice(selectionStart, selectionEnd) || fallback;
  const nextValue = `${value.slice(0, selectionStart)}${before}${selectedText}${after}${value.slice(selectionEnd)}`;
  const nextSelectionStart = selectionStart + before.length;
  const nextSelectionEnd = nextSelectionStart + selectedText.length;

  return {
    nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd,
  };
}

export function toggleWrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
  fallback = "",
): SelectionTransformResult {
  const hasWrappedSelection =
    selectionStart >= marker.length &&
    value.slice(selectionStart - marker.length, selectionStart) === marker &&
    value.slice(selectionEnd, selectionEnd + marker.length) === marker;

  if (hasWrappedSelection) {
    return {
      nextValue:
        value.slice(0, selectionStart - marker.length) +
        value.slice(selectionStart, selectionEnd) +
        value.slice(selectionEnd + marker.length),
      selectionStart: selectionStart - marker.length,
      selectionEnd: selectionEnd - marker.length,
    };
  }

  const selectedText = value.slice(selectionStart, selectionEnd);
  if (
    selectedText.startsWith(marker) &&
    selectedText.endsWith(marker) &&
    selectedText.length >= marker.length * 2
  ) {
    const unwrapped = selectedText.slice(marker.length, selectedText.length - marker.length);
    return {
      nextValue: value.slice(0, selectionStart) + unwrapped + value.slice(selectionEnd),
      selectionStart,
      selectionEnd: selectionStart + unwrapped.length,
    };
  }

  return wrapSelection(value, selectionStart, selectionEnd, marker, marker, fallback);
}

function getSelectedLineRange(value: string, selectionStart: number, selectionEnd: number) {
  const blockStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const blockEndIndex = value.indexOf("\n", selectionEnd);
  const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;

  return {
    blockStart,
    blockEnd,
    selectedBlock: value.slice(blockStart, blockEnd),
  };
}

export function togglePrefixSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  fallbackLine: string,
): SelectionTransformResult {
  const { blockStart, blockEnd, selectedBlock } = getSelectedLineRange(value, selectionStart, selectionEnd);
  const baseBlock = selectedBlock || fallbackLine;
  const lines = baseBlock.split("\n");
  const shouldRemove = lines.every((line) => !line.trim() || line.startsWith(prefix));
  const nextBlock = lines
    .map((line) => {
      if (!line.trim()) return line;
      return shouldRemove ? line.slice(prefix.length) : `${prefix}${line}`;
    })
    .join("\n");
  const nextValue = `${value.slice(0, blockStart)}${nextBlock}${value.slice(blockEnd)}`;

  return {
    nextValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}

export function toggleOrderedListSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  fallbackLine: string,
): SelectionTransformResult {
  const { blockStart, blockEnd, selectedBlock } = getSelectedLineRange(value, selectionStart, selectionEnd);
  const baseBlock = selectedBlock || fallbackLine;
  const lines = baseBlock.split("\n");
  const orderedPattern = /^\d+\.\s+/;
  const shouldRemove = lines.every((line) => !line.trim() || orderedPattern.test(line));
  let order = 1;
  const nextBlock = lines
    .map((line) => {
      if (!line.trim()) return line;
      if (shouldRemove) {
        return line.replace(orderedPattern, "");
      }

      const nextLine = `${order}. ${line}`;
      order += 1;
      return nextLine;
    })
    .join("\n");

  return {
    nextValue: `${value.slice(0, blockStart)}${nextBlock}${value.slice(blockEnd)}`,
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}
