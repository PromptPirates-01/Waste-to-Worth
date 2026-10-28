const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// One session per portal, so home / student / staff logins never mix.
export const getSession = (portal) => JSON.parse(localStorage.getItem("w2w_" + portal) || "null");
export const setSession = (portal, s) =>
  s ? localStorage.setItem("w2w_" + portal, JSON.stringify(s)) : localStorage.removeItem("w2w_" + portal);

export async function api(path, { portal, method = "GET", json, form } = {}) {
  const headers = {};
  const s = portal && getSession(portal);
  if (s) headers.Authorization = `Bearer ${s.access_token}`;
  let body;
  if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  else if (form) body = form;
  let res;
  try { res = await fetch(BASE + path, { method, headers, body }); }
  catch { throw new Error("Cannot reach the server. Is the backend running?"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && s) { setSession(portal, null); window.dispatchEvent(new Event("w2w-logout")); }
    const d = data.detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x) => x.msg).join(", ") : "Something went wrong");
  }
  return data;
}

export const inr = (n) => `₹${Number(n).toFixed(2)}`;
