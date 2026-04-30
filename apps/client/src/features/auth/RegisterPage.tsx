import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/shared/AuthShell";
import { useAuth } from "@/hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ email, password, name });
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Akademik Hub-a qoşulun"
      subtitle="Bir neçə addımda hesab yaradın və öyrənməyə başlayın."
    >
      <Card title="Qeydiyyat" subtitle="Əsas məlumatlar">
        <form onSubmit={onSubmit}>
          <Input
            label="Ad, soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error ? <p className="field__error">{error}</p> : null}
          <Button type="submit" loading={loading} style={{ width: "100%" }}>
            Hesab yarat
          </Button>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Artıq hesabınız var? <Link to="/login">Giriş</Link>
          </p>
        </form>
      </Card>
    </AuthShell>
  );
}
