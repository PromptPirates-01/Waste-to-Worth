import { useCallback, useEffect, useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { api, inr } from "../api";
import { motion, useSpring, useTransform } from "framer-motion";
import { Wallet as WalletIcon, ChevronUp } from "lucide-react";
const P = "student";
const TABS = [["wallet", "💰 Wallet"], ["bottle", "♻️ Bottle / wrapper"], ["donation", "🎁 Donation"], ["deals", "🍽️ Canteen deals"]];

function Count({ value }) {
  const spring = useSpring(0, { damping: 40, stiffness: 300 });
  const text = useTransform(spring, (v) => v.toFixed(0));
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span className="wc-big">{text}</motion.span>;
}
function Wallet({ w, refresh }) {
  const max = Math.floor(w.tokens / 10) * 10;
  const [t, setT] = useState(max);
  const [err, setErr] = useState("");
  const [last, setLast] = useState(null);
  useEffect(() => setT(max), [max]);

  const redeem = async () => {
    setErr("");
    try { setLast(await api("/api/campus/student/redeem", { portal: P, method: "POST", json: { tokens: Number(t) } })); refresh(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <>
      {(() => {
  const goal = Math.max(100, Math.ceil((w.tokens + 1) / 100) * 100);
  const pct = Math.min((w.tokens / goal) * 100, 100);
  const canRedeem = max >= 10 && Number(t) >= 10 && Number(t) <= max;
  return (
    <div className="wc">
      <header className="wc-head">
        <div className="wc-id">
          <div className="wc-ic"><WalletIcon size={24} /></div>
          <div>
            <h2 className="wc-title">Token Wallet</h2>
            <p className="wc-sub">Worth {inr(w.rupees)} at the canteen</p>
          </div>
        </div>
        <button type="button" className="wc-chev" aria-label="Collapse"><ChevronUp size={20} /></button>
      </header>

      <div className="wc-main">
        <div className="wc-num">
          <Count value={w.tokens} />
          <span className="wc-of">of {goal}</span>
          <span className="wc-unit">Tokens</span>
        </div>
        <div className="wc-bar">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: "easeInOut" }} />
        </div>
      </div>

      <div className="wc-list">
        <h3>Ways to earn</h3>
        <ul>
          <li><span>Bottle / wrapper in a dustbin</span><span>+10 tokens</span></li>
          <li><span>Donation with certificate</span><span>+20 tokens</span></li>
        </ul>
      </div>

      <div className="wc-redeem">
        <label htmlFor="redeem-tokens">Tokens to redeem <small>(10 tokens = ₹1)</small></label>
        <div className="wc-redeem-row">
          <input id="redeem-tokens" type="number" min={10} max={max} step={10} value={t} onChange={(e) => setT(e.target.value)} />
          <span>= {inr(Number(t) / 10)}</span>
        </div>
        {err && <div className="err">{err}</div>}
      </div>

      <button className="wc-btn" disabled={!canRedeem} onClick={redeem}>Redeem tokens</button>
    </div>
  );
})()}
      {last && (
        <div className="card">
          <b>Show this code at the canteen reception</b>
          <div className="code">{last.code}</div>
          <p style={{ textAlign: "center" }}>{inr(last.rupees)} · {last.tokens} tokens</p>
        </div>
      )}
      {w.redemptions.length > 0 && (<><h2>Redemptions</h2>
        {w.redemptions.map((r) => (
          <div className="card item" key={r.id}>
            <div><b>{r.code}</b> · {inr(r.rupees)}<br /><span className="muted">{new Date(r.created_at).toLocaleString()}</span></div>
            <span className={`badge ${r.status === "pending" ? "warn" : ""}`}>{r.status === "pending" ? "Show at reception" : "Collected"}</span>
          </div>))}</>)}
      <h2>History</h2>
      {w.history.length === 0 && <p className="sub">No activity yet. Submit a photo to earn tokens.</p>}
      {w.history.map((h, i) => (
        <div className="card item" key={i}>
          <span>{{ bottle: "Bottle / wrapper", donation: "Donation", redeem: "Redeemed" }[h.reason]}<br /><span className="muted">{new Date(h.created_at).toLocaleString()}</span></span>
          <b style={{ color: h.delta > 0 ? "var(--gd)" : "var(--rd)" }}>{h.delta > 0 ? "+" : ""}{h.delta}</b>
        </div>))}
    </>
  );
}

function Submit({ title, sub, fields, endpoint, refresh }) {
  const [files, setFiles] = useState({});
  const [k, setK] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const ready = fields.every(([n]) => files[n]);

  const go = async () => {
    setBusy(true); setMsg(null);
    try {
      const form = new FormData();
      fields.forEach(([n]) => form.append(n, files[n]));
      const r = await api(endpoint, { portal: P, method: "POST", form });
      setMsg({ ok: true, t: `✅ +${r.awarded} tokens. ${r.reason}` });
      setFiles({}); setK(k + 1); refresh();
    } catch (e) { setMsg({ ok: false, t: e.message }); }
    setBusy(false);
  };
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{title}</h2><p className="sub">{sub}</p>
      {fields.map(([n, label]) => <ImagePicker key={n + k} label={label} onChange={(f) => setFiles((s) => ({ ...s, [n]: f }))} />)}
      <button className="btn" disabled={!ready || busy} onClick={go}>{busy ? "Verifying with AI…" : "Submit for verification"}</button>
      {msg && <div className={msg.ok ? "ok" : "err"}>{msg.t}</div>}
    </div>
  );
}

function Deals() {
  const [o, setO] = useState(null);
  useEffect(() => { api("/api/campus/student/offers", { portal: P }).then(setO).catch(() => setO([])); }, []);
  if (!o) return <p className="sub">Loading…</p>;
  if (!o.length) return <p className="sub">No leftover deals posted today. Check again after 2 pm.</p>;
  return o.map((x) => (
    <div className="card item" key={x.id}>
      <div><b>{x.item_name}</b> · {x.quantity} left<br /><span className="muted">{x.description}</span></div>
      <div><s className="muted">{inr(x.original_price)}</s> <b style={{ color: "var(--gd)", fontSize: "1.2rem" }}>{inr(x.new_price)}</b> <span className="badge">{x.discount_percent}% off</span></div>
    </div>));
}

export default function Student({ onLogout }) {
  const [tab, setTab] = useState("wallet");
  const [w, setW] = useState(null);
  const [err, setErr] = useState("");
  const refresh = useCallback(() => api("/api/campus/student/wallet", { portal: P }).then(setW).catch((e) => setErr(e.message)), []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>🧑‍🎓 Student</h1>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
      {w && <span className="badge">{w.tokens} tokens · {inr(w.rupees)}</span>}
      <div className="tabs">{TABS.map(([id, l]) => <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{l}</button>)}</div>
      {err && <div className="err">{err}</div>}
      {tab === "wallet" && w && <Wallet w={w} refresh={refresh} />}
      {tab === "bottle" && <Submit title="Dustbin proof (+10 tokens)" sub="Photo of you putting a plastic bottle or wrapper in a dustbin. Max 10 per day." fields={[["image", "Photo"]]} endpoint="/api/campus/student/bottle" refresh={refresh} />}
      {tab === "donation" && <Submit title="Donation proof (+20 tokens)" sub="Both the donation photo and its certificate must be genuine." fields={[["photo", "Donation photo"], ["certificate", "Donation certificate"]]} endpoint="/api/campus/student/donation" refresh={refresh} />}
      {tab === "deals" && <Deals />}
    </>
  );
}
