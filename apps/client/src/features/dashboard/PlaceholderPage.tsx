import { Card } from "@/components/ui/Card";

export function PlaceholderPage({ body }: { title: string; body: string }) {
  return (
    <Card>
      <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.55 }}>{body}</p>
    </Card>
  );
}
