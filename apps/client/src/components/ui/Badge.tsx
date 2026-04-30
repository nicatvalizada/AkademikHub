import type { UserRole } from "@akademik/shared";

const labels: Record<UserRole, string> = {
  student: "Tələbə",
  teacher: "Müəllim",
  researcher: "Tədqiqatçı",
};

const tones: Record<UserRole, string> = {
  student: "badge badge--student",
  teacher: "badge badge--teacher",
  researcher: "badge badge--researcher",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <span className={tones[role]}>{labels[role]}</span>;
}
