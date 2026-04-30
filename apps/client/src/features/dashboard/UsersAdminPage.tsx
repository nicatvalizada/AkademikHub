import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RoleBadge } from "@/components/ui/Badge";
import * as usersApi from "@/api/users";
import type { IUser } from "@akademik/shared";

export function UsersAdminPage() {
  const [users, setUsers] = useState<IUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await usersApi.listUsers();
        if (!cancelled) setUsers(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Xəta");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card title="İstifadəçilər" subtitle="API xətası">
        <p className="field__error">{error}</p>
      </Card>
    );
  }

  if (!users) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <Spinner />
        <span style={{ color: "var(--text-secondary)" }}>Yüklənir…</span>
      </div>
    );
  }

  return (
    <Card title="İstifadəçilər" subtitle="Müəllim / tədqiqatçı üçün siyahı (Faza 1)">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
              <th style={{ padding: "0.5rem 0" }}>Ad</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "0.65rem 0" }}>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <RoleBadge role={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
