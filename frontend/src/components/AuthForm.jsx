import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, Eye, EyeOff, GraduationCap, Home, Lock, Mail, Recycle, User, UtensilsCrossed } from "lucide-react";
import { api, setSession } from "../api";

const PORTALS = {
  home: { label: "My Home", icon: Home, sub: "Track your food and stop waste at home" },
  student: { label: "Student", icon: GraduationCap, sub: "Earn tokens for every good habit" },
  staff: { label: "Canteen staff", icon: UtensilsCrossed, sub: "Post leftover deals in seconds" },
};

const beams = [
  { cls: "top", prop: "left", delay: 0 },
  { cls: "right", prop: "top", delay: 0.6 },
  { cls: "bottom", prop: "right", delay: 1.2 },
  { cls: "left", prop: "bottom", delay: 1.8 },
];

export default function AuthForm({ portal, onDone, onBack }) {
  const P = PORTALS[portal];
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "", full_name: "" });
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // 3D tilt
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rotateX = useTransform(my, [-300, 300], [10, -10]);
  const rotateY = useTransform(mx, [-300, 300], [-10, 10]);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const json = { email: f.email, password: f.password, ...(mode === "signup" && { full_name: f.full_name }) };
      setSession(portal, await api(`/api/auth/${portal}/${mode}`, { method: "POST", json }));
      onDone();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <main className="gl">
      <div className="gl-glow gl-glow-top" />
      <motion.div className="gl-glow gl-glow-mid" animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }} transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="gl-glow gl-glow-bot" animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1 }} />

      {onBack
        ? <button type="button" className="gl-back" onClick={onBack}><ChevronLeft size={16} /> Back</button>
        : <Link to="/" className="gl-back"><ChevronLeft size={16} /> Home</Link>}

      <motion.div className="gl-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ perspective: 1500 }}>
        <motion.div style={{ rotateX, rotateY }} onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ z: 10 }}>
          <div className="gl-card-outer">
            <div className="gl-beams">
              {beams.map((b) => (
                <motion.div key={b.cls} className={`gl-beam ${b.cls}`}
                  animate={{ [b.prop]: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                  transition={{
                    [b.prop]: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: b.delay },
                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: b.delay },
                  }} />
              ))}
            </div>

            <form className="gl-card" onSubmit={submit}>
              <div className="gl-head">
                <motion.div className="gl-logo" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.8 }}>
                  <Recycle size={20} />
                </motion.div>
                <span className="gl-pill"><P.icon size={12} /> {P.label}</span>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {mode === "login" ? "Welcome back" : "Create account"}
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  {mode === "login" ? P.sub : "This account works only in this portal"}
                </motion.p>
              </div>

              {mode === "signup" && (
                <div className="gl-field">
                  <User size={16} className={focus === "name" ? "on" : ""} />
                  <input placeholder="Full name" value={f.full_name} onChange={set("full_name")} onFocus={() => setFocus("name")} onBlur={() => setFocus(null)} required maxLength={80} />
                </div>
              )}
              <div className="gl-field">
                <Mail size={16} className={focus === "email" ? "on" : ""} />
                <input type="email" placeholder="Email address" value={f.email} onChange={set("email")} onFocus={() => setFocus("email")} onBlur={() => setFocus(null)} required />
              </div>
              <div className="gl-field">
                <Lock size={16} className={focus === "pw" ? "on" : ""} />
                <input type={show ? "text" : "password"} placeholder="Password (min 8 characters)" minLength={8} value={f.password} onChange={set("password")} onFocus={() => setFocus("pw")} onBlur={() => setFocus(null)} required style={{ paddingRight: 40 }} />
                <button type="button" className="gl-eye" onClick={() => setShow(!show)} aria-label="Show or hide password">
                  {show ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              {err && <div className="gl-err">{err}</div>}

              <motion.button className="gl-submit" type="submit" disabled={busy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <AnimatePresence mode="wait">
                  {busy ? (
                    <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span className="gl-spin" /></motion.span>
                  ) : (
                    <motion.span key="t" className="gl-submit-t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {mode === "login" ? "Log in" : "Create account"} <ArrowRight size={14} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <p className="gl-switch">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}