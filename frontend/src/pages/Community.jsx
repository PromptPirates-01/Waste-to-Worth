import { useCallback, useEffect, useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { api } from "../api";

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

      <div className="tabs">
        <button className={`tab ${filter === "" ? "on" : ""}`} onClick={() => setFilter("")}>All</button>
        {Object.entries(CATS).map(([k, v]) => <button key={k} className={`tab ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{v}</button>)}
      </div>
      {posts.length === 0 && <p className="sub">No posts yet. Be the first!</p>}
      {posts.map((p) => (
        <div className="card" key={p.id}>
          <div className="item"><span className="badge info">{CATS[p.category]}</span><span className="muted">{new Date(p.created_at).toLocaleString()}</span></div>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.message}</p>
          {p.photo_urls?.length > 0 && <div className="thumbs">{p.photo_urls.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>}
          <p><b>{p.name}</b> · <a href={`tel:${p.mobile}`}>{p.mobile}</a></p>
        </div>
      ))}
    </>
  );
}
