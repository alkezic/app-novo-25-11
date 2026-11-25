"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Pogrešan email ili lozinka.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="brand-mark" />
          Vozni <span className="accent-text">park</span>
        </div>
        <div className="login-sub">Prijavi se na svoj nalog</div>

        <div className="form-field" style={{ marginBottom: 14 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ime@firma.rs"
          />
        </div>

        <div className="form-field" style={{ marginBottom: 20 }}>
          <label htmlFor="password">Lozinka</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "Prijavljivanje..." : "Prijavi se"}
        </button>

        <div style={{ marginTop: 18, fontSize: 12, color: "var(--ink-soft)" }}>
          Nalozi se kreiraju ručno u Supabase panelu (Authentication → Users → Add user)
          — aplikacija nema sam-registraciju iz bezbednosnih razloga.
        </div>
      </form>
    </div>
  );
}
