import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Camera, GraduationCap, Home, Megaphone, ScanSearch, Sparkles, Wrench, ChevronDown } from "lucide-react";

const cards = [
  { index: "001", to: "/home", tag: "MY HOME", icon: Home, c: "145 63% 36%", l: "142 70% 80%", d: "138 76% 95%",
    title: "Track food expiry and get email alerts before it goes to waste." },
  { index: "002", to: "/campus", tag: "MY CAMPUS", icon: GraduationCap, c: "262 70% 55%", l: "261 90% 86%", d: "264 100% 97%",
    title: "Earn tokens for recycling and donating. Grab canteen deals on leftovers." },
  { index: "003", to: "/identify", tag: "IDENTIFY MY WASTE", icon: ScanSearch, c: "211 90% 52%", l: "210 100% 83%", d: "214 100% 97%",
    title: "Dry or wet? Recyclable? Get AI steps to recycle it." },
  { index: "004", to: "/reuse", tag: "CHECK REUSABILITY", icon: Wrench, c: "32 90% 45%", l: "41 100% 82%", d: "40 100% 95%",
    title: "Photo or description in, reuse and upcycle ideas out." },
  { index: "005", to: "/community", tag: "COMMUNITY BOARD", icon: Megaphone, c: "340 75% 50%", l: "345 100% 87%", d: "350 100% 97%",
    title: "Donate, exchange or find a repair. Open to everyone, no login." },
];

const spring = { type: "spring", stiffness: 200, damping: 15 };

const steps = [
  ["Snap", "Take a photo of the item, or just describe it."],
  ["AI checks", "Our AI sorts the waste type and works out what can be done with it."],
  ["Act", "Recycle it, reuse it, donate it, or earn campus tokens for it."],
];

const faqs = [
  ["Do I need an account?", "Not for identifying waste, checking reusability or the community board. Home and Campus need a login."],
  ["How do tokens work?", "A bottle or wrapper in a dustbin earns 10 tokens and a donation earns 20. Students redeem them at the canteen: 10 tokens = ₹1."],
  ["Is the community board a chat?", "No. Posts show a name and mobile number, and interested people contact you directly."],
  ["Who sees my photos?", "Photos go to our server for AI checking. The browser never talks to the AI or database directly."],
];

export default function Landing() {
  useEffect(() => {
    document.body.classList.add("green-bg");
    return () => document.body.classList.remove("green-bg");
  }, []);

  return (
    <div className="lp">
      {/* Hero */}
      <section className="lp-hero">
        <span className="lp-pill"><Sparkles size={14} /> AI-powered waste helper</span>
        <h1>Turn everyday waste into something worth keeping</h1>
        <p>What if things we throw away could become useful again? Snap a photo and Waste to Worth tells you how to recycle, reuse or donate it.</p>
        <div className="lp-cta">
          <Link to="/identify" className="lp-btn lp-btn-dark">Identify my waste <ArrowRight size={16} /></Link>
          <Link to="/reuse" className="lp-btn lp-btn-light">Check reusability</Link>
        </div>
      </section>

      {/* Tools */}
      <section className="lp-section">
        <h2>Pick a tool</h2>
        <div className="fcards">
          {cards.map((k) => (
            <Link key={k.to} to={k.to} className="fcard-link">
              <motion.div
                className="fcard"
                style={{ "--c": `hsl(${k.c})`, "--cl": `hsl(${k.l})`, "--cd": `hsl(${k.d})` }}
                initial="initial"
                whileHover="hover"
                variants={{ initial: { y: 0 }, hover: { y: -10 } }}
                transition={spring}
              >
                <div className="fcard-glow" />
                <div className="fcard-index">{k.index}</div>
                <motion.div
                  className="fcard-img"
                  variants={{ initial: { scale: 1, y: 0 }, hover: { scale: 1.3, y: -20 } }}
                  transition={spring}
                >
                  <k.icon size={84} strokeWidth={1.4} />
                </motion.div>
                <div className="fcard-body">
                  <span className="fcard-tag">{k.tag}</span>
                  <p>{k.title}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Facts strip */}
      <section className="lp-facts">
        <div><b>5</b><span>tools in one place</span></div>
        <div><b>₹1</b><span>per 10 tokens earned</span></div>
        <div><b>3</b><span>features need no login</span></div>
      </section>

      {/* Feature cards */}
      <section className="lp-section">
        <h2>Fast. Smart. Built for campuses.</h2>
        <div className="lp-feats">
          <div className="lp-feat lp-feat-big">
            <b className="lp-stat">4</b>
            <h3>Smart identification</h3>
            <p>One photo sorts waste into dry, wet, e-waste or hazardous, and says whether it can be recycled.</p>
          </div>
          <div className="lp-feat">
            <h3>Earn while you recycle</h3>
            <p>+10 tokens for a bottle or wrapper in a bin, +20 for a donation.</p>
            <Link to="/campus" className="lp-link">Open my campus <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section">
        <h2>How it works</h2>
        <div className="lp-steps">
          {steps.map(([t, d], i) => (
            <div className="lp-step" key={t}>
              <span className="lp-step-n">{i + 1}</span>
              <small>Step - 0{i + 1}</small>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <h2>Got questions? We got answers</h2>
        <div className="lp-faq">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}<ChevronDown size={18} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing banner */}
      <section className="lp-end">
        <h2>Start with a photo today</h2>
        <p>No sign-up needed to find out what your waste can become.</p>
        <Link to="/identify" className="lp-btn lp-btn-light"><Camera size={16} /> Identify my waste</Link>
      </section>

      <footer className="lp-foot">© 2026 Waste to Worth</footer>
    </div>
  );
}