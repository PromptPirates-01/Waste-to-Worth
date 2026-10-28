import { useRef, useState } from "react";

// Downscale camera photos (they can be 10+ MB) before upload.
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function ImagePicker({ label = "Photo", onChange, preview = true }) {
  const cam = useRef(), gal = useRef();
  const [url, setUrl] = useState(null);
  const handle = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const out = await shrink(f);
    if (preview) setUrl(URL.createObjectURL(out));
    onChange(out);
  };
  return (
    <div className="picker">
      <strong>{label}</strong>
      <div className="row" style={{ marginTop: 6 }}>
        <button type="button" className="btn ghost" onClick={() => cam.current.click()}>📷 Camera</button>
        <button type="button" className="btn ghost" onClick={() => gal.current.click()}>🖼️ Gallery</button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={handle} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={handle} />
      {preview && url && <img className="preview" src={url} alt="selected" />}
    </div>
  );
}
