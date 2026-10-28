import { useCallback, useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import { api, getSession, setSession } from "../api";

const P = "home";
const daysLeft = (d) => Math.round((new Date(d + "T00:00:00") - new Date(new Date().toDateString())) / 864e5);

function Badge({ d }) {
  const n = daysLeft(d);
  if (n < 0) return <span className="badge bad">Expired {-n}d ago</span>;
  if (n === 0) return <span className="badge bad">Expires today</span>;
  if (n <= 3) return <span className="badge warn">{n} day{n > 1 && "s"} left</span>;
  return <span className="badge">{n} days left</span>;
}

function Dashboard({ onLogout }) {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ name: "", quantity: "", expiry_date: "" });
  const [err, setErr] = useState("");
  const load = useCallback(() => api("/api/home/items", { portal: P }).then(setItems).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault(); setErr("");
    try { await api("/api/home/items", { portal: P, method: "POST", json: f }); setF({ name: "", quantity: "", expiry_date: "" }); load(); }
    catch (e2) { setErr(e2.message); }
  };
  const del = async (id) => { await api(`/api/home/items/${id}`, { portal: P, method: "DELETE" }); load(); };
  const soon = items.filter((i) => daysLeft(i.expiry_date) <= 3);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>🏠 My Home</h1>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
      {soon.length > 0 && <div className="card" style={{ borderColor: "var(--am)" }}>⚠️ {soon.length} item(s) need attention soon. We'll also email you each morning.</div>}
      <form className="card" onSubmit={add}>
        <h2 style={{ marginTop: 0 }}>Add food item</h2>
        <div className="two">
          <div><label>Item</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={80} /></div>
          <div><label>Quantity</label><input value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} placeholder="e.g. 2 packets, 500 g" required maxLength={40} /></div>
        </div>
        <label>Expiry date</label>
        <input type="date" value={f.expiry_date} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} required />
        {err && <div className="err">{err}</div>}
        <div style={{ marginTop: 12 }}><button className="btn">Add</button></div>
      </form>
      <h2>Your items</h2>
      {items.length === 0 && <p className="sub">Nothing added yet.</p>}
      {items.map((i) => (
        <div className="card item" key={i.id}>
          <div><b>{i.name}</b> · {i.quantity}<br /><span className="muted">Expires {i.expiry_date}</span></div>
          <div className="row"><Badge d={i.expiry_date} /><button className="btn danger" onClick={() => del(i.id)}>Remove</button></div>
        </div>
      ))}
    </>
  );
}

export default function HomePortal() {
  const [, tick] = useState(0);
  useEffect(() => { const h = () => tick((n) => n + 1); window.addEventListener("w2w-logout", h); return () => window.removeEventListener("w2w-logout", h); }, []);
  const logout = () => { setSession(P, null); tick((n) => n + 1); };
  return getSession(P)
    ? <Dashboard onLogout={logout} />
    : <AuthForm portal={P} title="My Home login" hint="Track what's in your kitchen and get an email before it expires." onDone={() => tick((n) => n + 1)} />;
}
