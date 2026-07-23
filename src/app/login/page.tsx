"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/form");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось войти");
    }
  };

  return (
    <div className="page" style={{ maxWidth: 360, paddingTop: "15vh" }}>
      <h1 className="page-title">Вход</h1>
      <p className="page-subtitle">Шаблонизатор документов ПДн</p>
      <form onSubmit={onSubmit} className="section">
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="row-actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Проверка…" : "Войти"}
          </button>
        </div>
      </form>
    </div>
  );
}
