import { useCallback, useEffect, useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { api } from "../api";
import { Gift, RefreshCw, Wrench } from "lucide-react";

const ICONS = { donate: Gift, exchange: RefreshCw, repair: Wrench };
const LABELS = { donate: "Donate", exchange: "Exchange", repair: "Repair tip" };
const VERBS = { donate: "is donating", exchange: "wants to exchange", repair: "shared a repair tip" };
const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const isNew = (d) => Date.now() - new Date(d).getTime() < 24 * 60 * 60 * 1000;

const CATS = { donate: "🎁 Donate", exchange: "🔄 Exchange", repair: "🔧 Repair tip" };
const blank = { name: "", mobile: "", category: "donate", message: "" };

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("");
  const [f, setF] = useState(blank);
  const [photos, setPhotos] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api("/api/community/posts" + (filter ? `?category=${filter}` : "")).then(setPosts).catch((e) => setMsg({ ok: false, t: e.message })), [filter]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const form = new FormData();
      Object.entries(f).forEach(([k, v]) => form.append(k, v));
      photos.forEach((p) => form.append("photos", p));
      await api("/api/community/posts", { method: "POST", form });
      setF(blank); setPhotos([]); setMsg({ ok: true, t: "Posted to the board!" }); load();
    } catch (e2) { setMsg({ ok: false, t: e2.message }); }
    setBusy(false);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <h1>📌 Community board</h1>
      <p className="sub">Open to everyone. Post something to donate, exchange or ask for repair help. Interested people contact you on your mobile number, so there is no chat here.</p>
      <form className="card" onSubmit={submit}>
        <div className="two">
          <div><label>Your name</label><input value={f.name} onChange={set("name")} required minLength={2} maxLength={60} /></div>
          <div><label>Mobile number</label><input value={f.mobile} onChange={set("mobile")} required inputMode="tel" placeholder="9876543210" /></div>
        </div>
        <label>Type</label>
        <select value={f.category} onChange={set("category")}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label>Message</label>
        <textarea rows={3} value={f.message} onChange={set("message")} required minLength={3} maxLength={500} placeholder="e.g. Giving away a study table, pickup near Gate 2" />
        {photos.length < 3 && <ImagePicker label={`Photos (${photos.length}/3)`} preview={false} onChange={(p) => setPhotos((a) => [...a, p].slice(0, 3))} />}
        {photos.length > 0 && <div className="thumbs">{photos.map((p, i) => <img key={i} src={URL.createObjectURL(p)} alt="" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} title="Tap to remove" />)}</div>}
        <div style={{ marginTop: 12 }}><button className="btn" disabled={busy}>{busy ? "Posting…" : "Post"}</button></div>
        {msg && <div className={msg.ok ? "ok" : "err"}>{msg.t}</div>}
      </form>

            <section className="cb">
        <div className="cb-head">
          <h2>Activity</h2>
          <span className="cb-badge">{posts.filter((p) => isNew(p.created_at)).length} New</span>
        </div>

        <div className="cb-tabs-wrap">
          <div className="cb-tabs" role="tablist">
            <button role="tab" aria-selected={filter === ""} className={filter === "" ? "on" : ""} onClick={() => setFilter("")}>All</button>
            {Object.entries(LABELS).map(([k, v]) => (
              <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{v}</button>
            ))}
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="cb-empty">No posts yet. Be the first!</p>
        ) : (
          <ul className="cb-list">
            {posts.map((p) => {
              const Icon = ICONS[p.category] || Gift;
              return (
                <li className="cb-row" key={p.id}>
                  <div className="cb-av">
                    <div className="cb-avatar">{initials(p.name)}</div>
                    <span className="cb-type"><Icon size={12} aria-hidden="true" /></span>
                  </div>
                  <div className="cb-body">
                    <p className="cb-line">
                      <span className="cb-name">{p.name}</span>{" "}
                      <span className="cb-act">{VERBS[p.category]}</span>
                    </p>
                    <p className="cb-msg">{p.message}</p>
                    {p.photo_urls?.length > 0 && (
                      <div className="thumbs">
                        {p.photo_urls.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}
                      </div>
                    )}
                    <span className="cb-time">
                      {new Date(p.created_at).toLocaleString()} · <a href={`tel:${p.mobile}`}>{p.mobile}</a>
                    </span>
                  </div>
                  {isNew(p.created_at) && <span className="cb-dot" role="img" aria-label="New" />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
