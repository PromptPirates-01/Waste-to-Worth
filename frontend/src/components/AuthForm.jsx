import { useState } from "react";
import { api, setSession } from "../api";

export default function AuthForm({ portal, title, hint, onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "", full_name: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const json = { email: f.email, password: f.password, ...(mode === "signup" && { full_name: f.full_name }) };
      setSession(portal, await api(`/api/auth/${portal}/${mode}`, { method: "POST", json }));
      onDone();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {hint && <p className="sub">{hint}</p>}
      {mode === "signup" && (<><label>Full name</label><input value={f.full_name} onChange={set("full_name")} required /></>)}
      <label>Email</label><input type="email" value={f.email} onChange={set("email")} required />
      <label>Password (min 8 characters)</label><input type="password" minLength={8} value={f.password} onChange={set("password")} required />
      {err && <div className="err">{err}</div>}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "New here? Sign up" : "Have an account? Log in"}
        </button>
      </div>
    </form>
  );
}
