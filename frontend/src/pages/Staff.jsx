import { useCallback, useEffect, useState } from "react";
import { api, inr } from "../api";

const P = "staff";
const blank = { item_name: "", description: "", quantity: "", original_price: "", discount_percent: "" };

export default function Staff({ onLogout }) {
  const [tab, setTab] = useState("post");
  const [f, setF] = useState(blank);
  const [offers, setOffers] = useState([]);
  const [reds, setReds] = useState([]);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    api("/api/campus/staff/offers", { portal: P }).then(setOffers).catch((e) => setErr(e.message));
    api("/api/campus/staff/redemptions", { portal: P }).then(setReds).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const preview = f.original_price && f.discount_percent ? Math.round(f.original_price * (100 - f.discount_percent)) / 100 : null;

  const post = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api("/api/campus/staff/offers", { portal: P, method: "POST", json: { ...f, quantity: +f.quantity, original_price: +f.original_price, discount_percent: +f.discount_percent } });
      setF(blank); setTab("list"); load();
    } catch (e2) { setErr(e2.message); }
  };
  const remove = async (id) => { await api(`/api/campus/staff/offers/${id}`, { portal: P, method: "DELETE" }); load(); };
  const fulfil = async (code) => { try { await api(`/api/campus/staff/redemptions/${code}/fulfil`, { portal: P, method: "POST" }); load(); } catch (e) { setErr(e.message); } };

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>🍽️ Canteen staff</h1>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
      <div className="tabs">
        {[["post", "➕ Post leftover item"], ["list", `📋 Today's listings (${offers.length})`], ["reds", `🎟️ Redemptions (${reds.length})`]].map(([id, l]) =>
          <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{l}</button>)}
      </div>
      {err && <div className="err">{err}</div>}

      {tab === "post" && (
        <form className="card" onSubmit={post}>
          <label>Item</label><input value={f.item_name} onChange={set("item_name")} required maxLength={80} placeholder="e.g. Veg sandwich" />
          <label>Description</label><textarea rows={2} value={f.description} onChange={set("description")} maxLength={300} placeholder="Made at 11 am, best before 6 pm" />
          <div className="two">
            <div><label>Quantity left</label><input type="number" min={1} value={f.quantity} onChange={set("quantity")} required /></div>
            <div><label>Original price (₹)</label><input type="number" min={1} step="0.01" value={f.original_price} onChange={set("original_price")} required /></div>
          </div>
          <label>Discount %</label><input type="number" min={1} max={90} value={f.discount_percent} onChange={set("discount_percent")} required />
          {preview !== null && <p>New rate: <b style={{ color: "var(--gd)", fontSize: "1.3rem" }}>{inr(preview)}</b></p>}
          <button className="btn">Publish deal</button>
        </form>
      )}

      {tab === "list" && (offers.length === 0 ? <p className="sub">Nothing posted today.</p> : offers.map((x) => (
        <div className="card item" key={x.id}>
          <div><b>{x.item_name}</b> · {x.quantity} left<br /><span className="muted">{x.description}</span></div>
          <div className="row"><s className="muted">{inr(x.original_price)}</s><b>{inr(x.new_price)}</b><span className="badge">{x.discount_percent}% off</span><button className="btn danger" onClick={() => remove(x.id)}>Remove</button></div>
        </div>)))}

      {tab === "reds" && (reds.length === 0 ? <p className="sub">No pending redemptions.</p> : reds.map((r) => (
        <div className="card item" key={r.id}>
          <div><b style={{ letterSpacing: ".15em" }}>{r.code}</b> · {inr(r.rupees)} ({r.tokens} tokens)<br /><span className="muted">{r.profiles?.full_name || r.profiles?.email}</span></div>
          <button className="btn" onClick={() => fulfil(r.code)}>Mark as given</button>
        </div>)))}
    </>
  );
}
