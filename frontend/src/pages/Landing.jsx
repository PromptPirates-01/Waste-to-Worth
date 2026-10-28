import { Link } from "react-router-dom";

const tiles = [
  ["/home", "🏠", "MY HOME", "Track food expiry and get email alerts before it goes to waste"],
  ["/campus", "🎓", "MY CAMPUS", "Earn tokens for recycling and donating. Canteen deals on leftovers"],
  ["/identify", "📷", "IDENTIFY MY WASTE", "Dry or wet? Recyclable? Get AI steps to recycle it"],
  ["/reuse", "🔧", "CHECK REUSABILITY", "Photo or description in, reuse and upcycle ideas out"],
];

export default function Landing() {
  return (
    <>
      <h1>What if things we throw away could become useful again?</h1>
      <p className="sub">Segregate smarter, reuse more, reward good habits.</p>
      <div className="grid">
        {tiles.map(([to, ic, t, d]) => (
          <Link key={to} to={to} className="tile"><div className="ic">{ic}</div><b>{t}</b><span>{d}</span></Link>
        ))}
      </div>
      <Link to="/community" className="tile" style={{ display: "block" }}>
        <div className="ic">📌</div><b>COMMUNITY BOARD</b>
        <span>Donate, exchange or find a repair. Open to everyone, no login needed</span>
      </Link>
    </>
  );
}
