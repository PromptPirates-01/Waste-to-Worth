import { useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { api } from "../api";

const LABEL = { dry: "Dry waste", wet: "Wet waste", "e-waste": "E-waste", hazardous: "Hazardous" };

export default function Identify() {
  const [img, setImg] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setErr(""); setRes(null);
    try {
      const form = new FormData(); form.append("image", img);
      setRes(await api("/api/ai/identify", { method: "POST", form }));
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <>
      <h1>📷 Identify my waste</h1>
      <p className="sub">Take a photo or pick one from your gallery.</p>
      <div className="card">
        <ImagePicker label="Waste photo" onChange={setImg} />
        <button className="btn" disabled={!img || busy} onClick={run}>{busy ? "Analysing…" : "Identify"}</button>
        {err && <div className="err">{err}</div>}
      </div>
      {res && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{res.item}</h2>
          <span className={`badge ${res.waste_type === "hazardous" ? "bad" : ""}`}>{LABEL[res.waste_type] || res.waste_type}</span>
          <span className={`badge ${res.recyclable ? "" : "bad"}`}>{res.recyclable ? "Recyclable" : "Non-recyclable"}</span>
          <span className="badge info">Confidence: {res.confidence}</span>
          <p>{res.reason}</p>
          {res.recyclable && res.steps?.length > 0 && (<><b>How to recycle it</b><ol>{res.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></>)}
        </div>
      )}
    </>
  );
}
