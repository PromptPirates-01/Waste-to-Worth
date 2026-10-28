import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import Student from "./Student";
import Staff from "./Staff";
import { getSession, setSession } from "../api";

export default function CampusPortal() {
  const [role, setRole] = useState(null); // "student" | "staff"
  const [, tick] = useState(0);
  useEffect(() => { const h = () => tick((n) => n + 1); window.addEventListener("w2w-logout", h); return () => window.removeEventListener("w2w-logout", h); }, []);
  const logout = () => { setSession(role, null); setRole(null); };

  if (!role) {
    return (
      <>
        <h1>🎓 My Campus</h1>
        <p className="sub">Choose how you want to log in.</p>
        <div className="grid">
          <button className="tile" onClick={() => setRole("student")}><div className="ic">🧑‍🎓</div><b>STUDENT</b><span>Earn tokens, redeem at the canteen, see today's deals</span></button>
          <button className="tile" onClick={() => setRole("staff")}><div className="ic">🍽️</div><b>CANTEEN STAFF</b><span>List leftover items with a discount, confirm redemptions</span></button>
        </div>
      </>
    );
  }
  if (!getSession(role)) {
    return (
      <>
        <button className="btn ghost" onClick={() => setRole(null)}>← Back</button>
        <AuthForm portal={role} title={role === "student" ? "Student login" : "Canteen staff login"} onDone={() => tick((n) => n + 1)} />
      </>
    );
  }
  return role === "student" ? <Student onLogout={logout} /> : <Staff onLogout={logout} />;
}
