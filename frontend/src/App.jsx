import { Link, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Identify from "./pages/Identify";
import Reuse from "./pages/Reuse";
import HomePortal from "./pages/HomePortal";
import CampusPortal from "./pages/CampusPortal";
import Community from "./pages/Community";

export default function App() {
  return (
    <>
      <header className="top">
        <Link to="/" className="brand">♻️ Waste to Worth</Link>
        <Link to="/community" className="muted">Community</Link>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/reuse" element={<Reuse />} />
          <Route path="/home" element={<HomePortal />} />
          <Route path="/campus" element={<CampusPortal />} />
          <Route path="/community" element={<Community />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
    </>
  );
}
