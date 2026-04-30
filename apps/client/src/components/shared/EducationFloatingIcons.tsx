import type { CSSProperties, FC } from "react";

const ANIM_TIME_SCALE = 0.82;

type Slot = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  dur: number;
  delay: number;
  size?: number;
  motion?: "float" | "sway" | "drift";
  opacity?: number;
};

const NAVBAR_SLOTS: Slot[] = [
  {
    top: "20%",
    left: "8%",
    dur: 18,
    delay: -2,
    size: 28,
    motion: "float",
    opacity: 0.28,
  },
  {
    bottom: "18%",
    left: "14%",
    dur: 21,
    delay: -7,
    size: 30,
    motion: "drift",
    opacity: 0.24,
  },
  {
    top: "26%",
    left: "24%",
    dur: 19,
    delay: -5,
    size: 26,
    motion: "sway",
    opacity: 0.22,
  },
  {
    bottom: "22%",
    left: "34%",
    dur: 20,
    delay: -9,
    size: 28,
    motion: "float",
    opacity: 0.2,
  },
  {
    top: "16%",
    left: "40%",
    dur: 22,
    delay: -3,
    size: 24,
    motion: "drift",
    opacity: 0.18,
  },
  {
    bottom: "16%",
    left: "46%",
    dur: 19,
    delay: -10,
    size: 26,
    motion: "sway",
    opacity: 0.16,
  },
  {
    top: "20%",
    right: "8%",
    dur: 18,
    delay: -4,
    size: 28,
    motion: "float",
    opacity: 0.28,
  },
  {
    bottom: "18%",
    right: "14%",
    dur: 21,
    delay: -8,
    size: 30,
    motion: "drift",
    opacity: 0.24,
  },
  {
    top: "26%",
    right: "24%",
    dur: 19,
    delay: -6,
    size: 26,
    motion: "sway",
    opacity: 0.22,
  },
  {
    bottom: "22%",
    right: "34%",
    dur: 20,
    delay: -11,
    size: 28,
    motion: "float",
    opacity: 0.2,
  },
  {
    top: "16%",
    right: "40%",
    dur: 22,
    delay: -5,
    size: 24,
    motion: "drift",
    opacity: 0.18,
  },
  {
    bottom: "16%",
    right: "46%",
    dur: 19,
    delay: -12,
    size: 26,
    motion: "sway",
    opacity: 0.16,
  },
];

const BASE_SLOTS: Slot[] = [
  { top: "4%", left: "14%", dur: 11, delay: 0, size: 36, motion: "float" },
  { top: "7%", left: "28%", dur: 14, delay: -2, size: 42, motion: "sway" },
  { top: "5%", left: "48%", dur: 13, delay: -4, size: 38, motion: "drift" },
  { top: "9%", left: "62%", dur: 12, delay: -1, size: 40, motion: "float" },
  { top: "3%", right: "22%", dur: 16, delay: -5, size: 44, motion: "sway" },
  { top: "6%", right: "6%", dur: 10, delay: -6, size: 34, motion: "float" },
  { top: "18%", left: "4%", dur: 15, delay: -3, size: 40, motion: "drift" },
  { top: "22%", left: "18%", dur: 11, delay: -7, size: 38, motion: "sway" },
  { top: "20%", left: "38%", dur: 13, delay: -2, size: 42, motion: "float" },
  { top: "16%", left: "55%", dur: 14, delay: -8, size: 36, motion: "drift" },
  { top: "19%", right: "32%", dur: 12, delay: -4, size: 40, motion: "float" },
  { top: "14%", right: "12%", dur: 11, delay: -1, size: 38, motion: "sway" },
  { top: "32%", left: "8%", dur: 13, delay: -5, size: 42, motion: "float" },
  { top: "36%", left: "26%", dur: 10, delay: -9, size: 36, motion: "sway" },
  { top: "34%", left: "44%", dur: 15, delay: -3, size: 40, motion: "drift" },
  { top: "30%", left: "68%", dur: 12, delay: -6, size: 38, motion: "float" },
  { top: "38%", right: "24%", dur: 14, delay: -2, size: 44, motion: "sway" },
  { top: "33%", right: "5%", dur: 11, delay: -7, size: 36, motion: "float" },
  { top: "48%", left: "2%", dur: 16, delay: -4, size: 40, motion: "drift" },
  { top: "52%", left: "20%", dur: 12, delay: -8, size: 38, motion: "float" },
  { top: "50%", left: "52%", dur: 13, delay: -1, size: 42, motion: "sway" },
  { top: "46%", right: "38%", dur: 10, delay: -5, size: 36, motion: "float" },
  { top: "54%", right: "8%", dur: 15, delay: -3, size: 40, motion: "sway" },
  { top: "62%", left: "12%", dur: 11, delay: -6, size: 38, motion: "float" },
  { top: "58%", left: "36%", dur: 14, delay: -2, size: 42, motion: "drift" },
  { top: "65%", left: "58%", dur: 12, delay: -9, size: 36, motion: "float" },
  { top: "60%", right: "18%", dur: 13, delay: -4, size: 40, motion: "sway" },
  { top: "68%", right: "4%", dur: 11, delay: -7, size: 38, motion: "float" },
  { bottom: "28%", left: "6%", dur: 15, delay: -3, size: 40, motion: "drift" },
  { bottom: "24%", left: "30%", dur: 12, delay: -5, size: 38, motion: "sway" },
  { bottom: "30%", left: "50%", dur: 10, delay: -8, size: 36, motion: "float" },
  {
    bottom: "22%",
    right: "28%",
    dur: 14,
    delay: -2,
    size: 42,
    motion: "drift",
  },
  { bottom: "18%", right: "8%", dur: 13, delay: -6, size: 40, motion: "float" },
  { bottom: "10%", left: "14%", dur: 11, delay: -4, size: 38, motion: "sway" },
  { bottom: "8%", left: "42%", dur: 16, delay: -1, size: 36, motion: "drift" },
  { bottom: "12%", left: "72%", dur: 12, delay: -7, size: 40, motion: "float" },
  { bottom: "14%", right: "42%", dur: 14, delay: -5, size: 38, motion: "sway" },
  { bottom: "6%", right: "16%", dur: 13, delay: -9, size: 42, motion: "float" },
  { top: "41%", left: "78%", dur: 11, delay: -3, size: 34, motion: "drift" },
  { top: "72%", left: "78%", dur: 12, delay: -6, size: 38, motion: "sway" },
  { bottom: "38%", left: "78%", dur: 10, delay: -4, size: 36, motion: "float" },
];

const AUTH_EXTRA_SLOTS: Slot[] = [
  {
    top: "11%",
    left: "9%",
    dur: 13,
    delay: -3,
    size: 32,
    motion: "drift",
    opacity: 0.22,
  },
  {
    top: "12%",
    left: "72%",
    dur: 15,
    delay: -6,
    size: 34,
    motion: "float",
    opacity: 0.24,
  },
  {
    top: "9%",
    left: "22%",
    dur: 12,
    delay: -5,
    size: 28,
    motion: "float",
    opacity: 0.19,
  },
  {
    top: "8%",
    left: "40%",
    dur: 14,
    delay: -7,
    size: 30,
    motion: "sway",
    opacity: 0.2,
  },
  {
    top: "10%",
    left: "56%",
    dur: 13,
    delay: -9,
    size: 28,
    motion: "drift",
    opacity: 0.18,
  },
  {
    top: "8%",
    right: "14%",
    dur: 16,
    delay: -4,
    size: 30,
    motion: "float",
    opacity: 0.2,
  },
  {
    top: "27%",
    left: "12%",
    dur: 12,
    delay: -2,
    size: 30,
    motion: "sway",
    opacity: 0.23,
  },
  {
    top: "26%",
    right: "16%",
    dur: 14,
    delay: -4,
    size: 32,
    motion: "drift",
    opacity: 0.21,
  },
  {
    top: "24%",
    left: "30%",
    dur: 13,
    delay: -6,
    size: 28,
    motion: "float",
    opacity: 0.19,
  },
  {
    top: "22%",
    left: "50%",
    dur: 15,
    delay: -1,
    size: 30,
    motion: "drift",
    opacity: 0.18,
  },
  {
    top: "28%",
    right: "30%",
    dur: 11,
    delay: -8,
    size: 29,
    motion: "sway",
    opacity: 0.2,
  },
  {
    top: "43%",
    left: "14%",
    dur: 11,
    delay: -7,
    size: 30,
    motion: "float",
    opacity: 0.24,
  },
  {
    top: "44%",
    right: "14%",
    dur: 13,
    delay: -5,
    size: 34,
    motion: "sway",
    opacity: 0.22,
  },
  {
    top: "40%",
    left: "30%",
    dur: 12,
    delay: -3,
    size: 28,
    motion: "drift",
    opacity: 0.19,
  },
  {
    top: "38%",
    left: "58%",
    dur: 15,
    delay: -10,
    size: 30,
    motion: "float",
    opacity: 0.18,
  },
  {
    top: "46%",
    right: "30%",
    dur: 14,
    delay: -6,
    size: 28,
    motion: "sway",
    opacity: 0.19,
  },
  {
    top: "57%",
    left: "8%",
    dur: 15,
    delay: -1,
    size: 32,
    motion: "drift",
    opacity: 0.22,
  },
  {
    top: "58%",
    right: "27%",
    dur: 12,
    delay: -8,
    size: 30,
    motion: "float",
    opacity: 0.2,
  },
  {
    top: "55%",
    left: "26%",
    dur: 13,
    delay: -4,
    size: 29,
    motion: "sway",
    opacity: 0.2,
  },
  {
    top: "60%",
    left: "44%",
    dur: 16,
    delay: -2,
    size: 30,
    motion: "drift",
    opacity: 0.18,
  },
  {
    top: "63%",
    left: "66%",
    dur: 11,
    delay: -9,
    size: 28,
    motion: "float",
    opacity: 0.19,
  },
  {
    bottom: "26%",
    left: "18%",
    dur: 14,
    delay: -6,
    size: 32,
    motion: "sway",
    opacity: 0.23,
  },
  {
    bottom: "20%",
    left: "62%",
    dur: 13,
    delay: -2,
    size: 30,
    motion: "drift",
    opacity: 0.21,
  },
  {
    bottom: "16%",
    right: "18%",
    dur: 16,
    delay: -7,
    size: 34,
    motion: "float",
    opacity: 0.22,
  },
  {
    bottom: "5%",
    left: "58%",
    dur: 12,
    delay: -4,
    size: 30,
    motion: "sway",
    opacity: 0.21,
  },
  {
    bottom: "30%",
    left: "8%",
    dur: 12,
    delay: -5,
    size: 28,
    motion: "float",
    opacity: 0.18,
  },
  {
    bottom: "32%",
    left: "42%",
    dur: 14,
    delay: -8,
    size: 30,
    motion: "drift",
    opacity: 0.18,
  },
  {
    bottom: "28%",
    right: "10%",
    dur: 15,
    delay: -3,
    size: 29,
    motion: "sway",
    opacity: 0.2,
  },
  {
    bottom: "12%",
    left: "28%",
    dur: 13,
    delay: -6,
    size: 28,
    motion: "float",
    opacity: 0.19,
  },
  {
    bottom: "10%",
    left: "74%",
    dur: 11,
    delay: -1,
    size: 30,
    motion: "drift",
    opacity: 0.18,
  },
  {
    bottom: "4%",
    right: "30%",
    dur: 16,
    delay: -7,
    size: 28,
    motion: "sway",
    opacity: 0.19,
  },
];

const ICON_COMPONENTS: FC[] = [
  IconPencil,
  IconBook,
  IconGradCap,
  IconRuler,
  IconNotebook,
  IconClipboard,
  IconLightbulb,
  IconSearch,
  IconCalculator,
  IconGlobe,
  IconBookmark,
];

type Placement = "auth" | "dashboard" | "navbar";

export function EducationFloatingIcons({
  placement,
}: {
  placement: Placement;
}) {
  const slots =
    placement === "auth"
      ? [...BASE_SLOTS, ...AUTH_EXTRA_SLOTS]
      : placement === "navbar"
        ? NAVBAR_SLOTS
        : BASE_SLOTS;
  const wrapClass =
    placement === "auth"
      ? "edu-floating edu-floating--auth"
      : placement === "navbar"
        ? "edu-floating edu-floating--navbar"
        : "edu-floating edu-floating--dashboard";

  return (
    <div className={wrapClass} aria-hidden>
      {slots.map((slot, i) => {
        const style: CSSProperties = {
          width: slot.size ?? 44,
          height: slot.size ?? 44,
          top: slot.top,
          left: slot.left,
          right: slot.right,
          bottom: slot.bottom,
          ["--edu-float-dur" as string]: `${(slot.dur * ANIM_TIME_SCALE).toFixed(2)}s`,
          ["--edu-breathe-dur" as string]: `${(slot.dur * ANIM_TIME_SCALE * 0.92).toFixed(2)}s`,
          ["--edu-float-delay" as string]: `${(slot.delay * ANIM_TIME_SCALE).toFixed(2)}s`,
          ["--edu-item-opacity" as string]:
            slot.opacity ?? "var(--auth-bg-icon-opacity)",
        };
        const Cmp = ICON_COMPONENTS[i % ICON_COMPONENTS.length];
        return (
          <span
            key={i}
            className={`edu-floating__item${
              slot.motion === "sway"
                ? " edu-floating__item--sway"
                : slot.motion === "drift"
                  ? " edu-floating__item--drift"
                  : ""
            }`}
            style={style}
          >
            <Cmp />
          </span>
        );
      })}
    </div>
  );
}

function IconPencil() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 24l2 6 6-2 14-14-4-4L6 22l-2 2z" />
      <path d="M18 8l6 6" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6h9a4 4 0 014 4v18a2 2 0 00-2-2H6V6z" />
      <path d="M26 6h-9a4 4 0 00-4 4v18a2 2 0 012-2h11V6z" />
    </svg>
  );
}

function IconGradCap() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14L16 8l12 6-12 6-12-6z" />
      <path d="M8 16.5V22c0 2 4 4 8 4s8-2 8-4v-5.5" />
      <path d="M22 19v5" />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 26L26 6" />
      <path d="M9 23l2-2M12 20l2-2M15 17l2-2M18 14l2-2M21 11l2-2" />
    </svg>
  );
}

function IconNotebook() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="4" width="16" height="24" rx="2" />
      <path d="M12 10h8M12 15h8M12 20h5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 6h10a2 2 0 012 2v20a2 2 0 01-2 2H11a2 2 0 01-2-2V8a2 2 0 012-2z" />
      <path d="M12 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M11 12h10M11 17h10M11 22h6" />
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4a7 7 0 00-4 12.7V20h8v-3.3A7 7 0 0016 4z" />
      <path d="M12 22h8M13 26h6" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13" cy="13" r="7" />
      <path d="M22 22l6 6" />
    </svg>
  );
}

function IconCalculator() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="4" width="16" height="24" rx="3" />
      <path d="M12 9h8" />
      <path d="M12 15h2M18 15h2M12 20h2M18 20h2M12 25h8" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="11" />
      <path d="M5 16h22" />
      <path d="M16 5a18 18 0 010 22" />
      <path d="M16 5a18 18 0 000 22" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 5h12a2 2 0 012 2v20l-8-5-8 5V7a2 2 0 012-2z" />
    </svg>
  );
}
