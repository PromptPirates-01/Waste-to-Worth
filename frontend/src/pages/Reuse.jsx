import { useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { api } from "../api";

export default function Reuse() {
  const [img, setImg] = useState(null);
  const [desc, setDesc] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setErr(""); setRes(null);
    try {
      const form = new FormData();
      if (img) form.append("image", img);
      form.append("description", desc);
      setRes(await api("/api/ai/reuse", { method: "POST", form }));
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <>
      <h1>🔧 Check reusability</h1>
      <p className="sub">Upload a photo, use the camera, or just describe the item.</p>
      <div className="card">
        <ImagePicker label="Item photo (optional)" onChange={setImg} />
        <label>Or describe it</label>
        <textarea rows={3} maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. old cotton t-shirt with a torn sleeve" />
        <div style={{ marginTop: 12 }}>
          <button className="btn" disabled={(!img && !desc.trim()) || busy} onClick={run}>{busy ? "Analysing…" : "Check reusability"}</button>
        </div>
        {err && <div className="err">{err}</div>}
      </div>
      {res && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{res.item}</h2>
          <span className={`badge ${res.reusable ? "" : "bad"}`}>{res.reusable ? "Reusable" : "Not reusable"}</span>
          <p>{res.reason}</p>
          {res.reusable && res.steps?.length > 0 && (<><b>Steps</b><ol>{res.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></>)}
          {!res.reusable && res.alternatives?.length > 0 && (<><b>Better options</b><ul>{res.alternatives.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
        </div>
      )}
    </>
  );
}
