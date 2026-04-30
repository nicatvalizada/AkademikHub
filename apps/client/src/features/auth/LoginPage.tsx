import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const from = location.state?.from?.pathname ?? "/app/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Xoş gəlmisiniz"
      subtitle="Hesabınıza daxil olun və dərs materiallarına keçid əldə edin."
    >
      <Card title="Giriş" subtitle="Email və şifrənizi daxil edin">
        <form onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Şifrə"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="field__error">{error}</p> : null}
          <Button type="submit" loading={loading} style={{ width: "100%" }}>
            Daxil ol
          </Button>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Hesabınız yoxdur? <Link to="/register">Qeydiyyat</Link>
          </p>
        </form>
      </Card>
    </AuthShell>
  );
}
